# Windows PowerShell 5.1; no downloads or third-party modules.
$ErrorActionPreference = 'Stop'

function ConvertTo-PskoCidr([string]$Text) {
  if ($Text.Trim() -notmatch '^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})/(\d{1,2})$') { throw 'IPv4 CIDR 형식으로 입력하세요. 예: 192.168.0.0/24' }
  $octets = @(1..4 | ForEach-Object { [int]$Matches[$_] })
  $prefix = [int]$Matches[5]
  if (($octets | Where-Object { $_ -gt 255 }).Count -or $prefix -gt 32) { throw 'IP 주소 또는 접두사 길이가 올바르지 않습니다.' }
  [uint64]$number = $octets[0]*16777216L + $octets[1]*65536L + $octets[2]*256L + $octets[3]
  [uint64]$size = [math]::Pow(2,32-$prefix)
  [uint64]$start = [math]::Floor($number/$size)*$size
  [uint64]$end = $start+$size-1
  # Entire range must fit inside RFC1918 or Radmin's 26/8 range.
  $allowed = ($start -ge 167772160 -and $end -le 184549375) -or
    ($start -ge 2886729728 -and $end -le 2887778303) -or
    ($start -ge 3232235520 -and $end -le 3232301055) -or
    ($start -ge 436207616 -and $end -le 452984831)
  if (-not $allowed) { throw '사설 LAN(10/8, 172.16/12, 192.168/16) 또는 Radmin(26/8) 안의 범위만 허용합니다.' }
  $network = '{0}.{1}.{2}.{3}' -f [math]::Floor($start/16777216),([math]::Floor($start/65536)%256),([math]::Floor($start/256)%256),($start%256)
  [uint64]$mask = 4294967296L-$size
  $maskText = '{0}.{1}.{2}.{3}' -f [math]::Floor($mask/16777216),([math]::Floor($mask/65536)%256),([math]::Floor($mask/256)%256),($mask%256)
  [pscustomobject]@{ Cidr="$network/$prefix"; Count=$size; FirewallAddress=$(if ($prefix -eq 32) { $network } else { "$network/$maskText" }) }
}

function ConvertTo-PskoPortRange([string]$Text) {
  $values = @([regex]::Matches($Text,'(?m):\s*(\d+)\s*$') | ForEach-Object { [long]$_.Groups[1].Value })
  if ($values.Count -ne 2 -or $values[0] -lt 1024 -or $values[1] -lt 1 -or ($values[0]+$values[1]-1) -gt 65535) { throw 'Windows의 동적 UDP 포트 범위를 확인하지 못했습니다. 설정을 변경하지 않습니다.' }
  '{0}-{1}' -f $values[0],($values[0]+$values[1]-1)
}

function Get-PskoNetworks {
  foreach ($config in Get-NetIPConfiguration) {
    if ($config.NetAdapter.Status -ne 'Up') { continue }
    foreach ($address in $config.IPv4Address) {
      try { $range = ConvertTo-PskoCidr "$($address.IPAddress)/$($address.PrefixLength)" } catch { continue }
      [pscustomobject]@{ Interface=$config.InterfaceAlias; Cidr=$range.Cidr; Priority= $(if ($address.IPAddress.StartsWith('26.')) { 2 } elseif ($config.IPv4DefaultGateway) { 0 } else { 1 }) }
    }
  }
}

function Get-PskoChrome {
  $paths = @(Get-Process chrome -ErrorAction SilentlyContinue | ForEach-Object { $_.Path } | Where-Object { $_ } | Select-Object -Unique)
  if ($paths.Count -gt 1) { throw '여러 Chrome 설치본이 실행 중입니다. 게임에 사용할 Chrome만 실행해 주세요.' }
  if (-not $paths.Count) {
    $paths = @(@("$env:ProgramFiles/Google/Chrome/Application/chrome.exe", "${env:ProgramFiles(x86)}/Google/Chrome/Application/chrome.exe", "$env:LOCALAPPDATA/Google/Chrome/Application/chrome.exe") | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1)
  }
  if (-not $paths.Count) { throw 'Chrome을 찾지 못했습니다. Chrome에서 게임을 연 뒤 다시 실행하세요.' }
  $path = (Get-Item -LiteralPath $paths[0]).FullName
  $signature = Get-AuthenticodeSignature -LiteralPath $path
  if ($signature.Status -ne 'Valid' -or $signature.SignerCertificate.Subject -notmatch 'Google LLC') { throw 'Chrome의 Google 서명을 확인하지 못했습니다.' }
  $path
}

function Add-PskoLanRule([string]$Cidr, [string]$Program, [string]$Ports) {
  $range = ConvertTo-PskoCidr $Cidr
  $Cidr = $range.Cidr
  if ($Ports -notmatch '^(\d+)-(\d+)$' -or [int]$Matches[1] -lt 1024 -or [int]$Matches[2] -gt 65535 -or [int]$Matches[1] -gt [int]$Matches[2]) { throw '잘못된 UDP 포트 범위입니다.' }
  $name = 'PSKO-LAN-CIDR-' + $Cidr.Replace('.','-').Replace('/','-')
  $existing = Get-NetFirewallRule -Name $name -ErrorAction SilentlyContinue
  $created = $false
  try {
    if (-not $existing) {
      New-NetFirewallRule -Name $name -DisplayName "PokeSurvivor Chrome UDP - $Cidr" -Group 'PokeSurvivor LAN CIDR' -Description 'User-approved LAN range for Chrome UDP. Remove with the PokeSurvivor LAN tool.' -Program $Program -Direction Inbound -Action Allow -Protocol UDP -LocalPort $Ports -RemoteAddress $Cidr -Profile Any -Enabled True | Out-Null
      $created = $true
    }
    $rule = Get-NetFirewallRule -Name $name
    $portFilter = $rule | Get-NetFirewallPortFilter
    $addressFilter = $rule | Get-NetFirewallAddressFilter
    $app = $rule | Get-NetFirewallApplicationFilter
    if ($rule.Enabled.ToString() -ne 'True' -or $rule.Group -ne 'PokeSurvivor LAN CIDR' -or $rule.Profile.ToString() -ne 'Any' -or $rule.Action.ToString() -ne 'Allow' -or $rule.Direction.ToString() -ne 'Inbound' -or $portFilter.Protocol -ne 'UDP' -or $portFilter.LocalPort -ne $Ports -or @($addressFilter.RemoteAddress).Count -ne 1 -or @($addressFilter.RemoteAddress)[0] -notin @($Cidr,$range.FirewallAddress) -or $app.Program -ne $Program) { throw '같은 이름의 규칙이 다른 범위를 사용하거나 검증에 실패했습니다. 기존 규칙을 확인하세요.' }
    $name
  } catch {
    if ($created) { Remove-NetFirewallRule -Name $name }
    throw
  }
}

function Remove-PskoLanRules {
  $rules = @(Get-NetFirewallRule -Group 'PokeSurvivor LAN CIDR' -ErrorAction SilentlyContinue | Where-Object { $_.Name -like 'PSKO-LAN-CIDR-*' })
  if (-not $rules.Count) { Write-Host '이 도구로 만든 CIDR 규칙이 없습니다.'; return }
  $rules | ForEach-Object { Write-Host $_.DisplayName }
  if ((Read-Host '위 CIDR 규칙을 삭제하려면 DELETE 입력 (그 외 취소)') -cne 'DELETE') { return }
  foreach ($rule in $rules) { Remove-NetFirewallRule -Name $rule.Name }
  foreach ($rule in $rules) { if (Get-NetFirewallRule -Name $rule.Name -ErrorAction SilentlyContinue) { throw '일부 규칙이 삭제되지 않았습니다.' } }
  Write-Host 'CIDR 규칙을 삭제했습니다. 다른 방화벽 규칙은 유지됩니다.'
}

if ($MyInvocation.InvocationName -eq '.') { return }
try {
  $principal = New-Object Security.Principal.WindowsPrincipal([Security.Principal.WindowsIdentity]::GetCurrent())
  if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) { throw 'run-as-administrator.cmd를 우클릭해서 관리자 권한으로 실행하세요.' }
  Write-Host 'PokeSurvivor - Windows LAN 방화벽 도구'
  Write-Host '1: CIDR 허용 규칙 추가 / 2: 이 도구의 CIDR 규칙 삭제 / 그 외: 종료'
  $choice = Read-Host '선택'
  if ($choice -eq '2') { Remove-PskoLanRules; return }
  if ($choice -ne '1') { return }
  $program = Get-PskoChrome
  $portText = (& netsh int ipv4 show dynamicport udp | Out-String)
  if ($LASTEXITCODE -ne 0) { throw '동적 UDP 포트 조회가 실패했습니다.' }
  $ports = ConvertTo-PskoPortRange $portText
  $networks = @(Get-PskoNetworks | Sort-Object Priority,Interface)
  Write-Host '현재 연결에서 찾은 대역 (공유기 이름이 아닌 IP 범위입니다):'
  $networks | ForEach-Object { Write-Host ("  {0}: {1}" -f $_.Interface,$_.Cidr) }
  $suggested = if ($networks.Count) { $networks[0].Cidr } else { '' }
  $text = Read-Host "허용할 CIDR 입력 [Enter: $suggested]"
  if (-not $text.Trim()) { $text = $suggested }
  $range = ConvertTo-PskoCidr $text
  Write-Host "`n프로그램: $program"
  Write-Host "허용 범위: $($range.Cidr) ($($range.Count)개 주소)"
  Write-Host "동작: 인바운드 UDP / 로컬 포트 $ports / 모든 Windows 네트워크 프로필"
  Write-Host '이 범위의 다른 기기도 Chrome에 접속할 수 있습니다. 신뢰하는 대역만 허용하세요.'
  Write-Host '게임 사이트에만 한정되는 규칙이 아니라 Chrome 프로그램에 적용됩니다.'
  Write-Host 'Wi-Fi 또는 Radmin 그룹 이름에 묶이지 않으며, 다른 네트워크로 이동해도 규칙은 남습니다.'
  Write-Host '방화벽 전체와 공유기 포트포워딩은 변경하지 않습니다.'
  if ((Read-Host '위 범위를 허용하려면 YES 입력 (그 외 취소)') -cne 'YES') { Write-Host '취소했습니다.'; return }
  Add-PskoLanRule $range.Cidr $program $ports | Out-Null
  Write-Host '허용 규칙을 검증했습니다. 모든 PC에서 게임 설정 → 네트워크 → P2P 직접 연결을 켠 뒤 방에 다시 참가하세요.'
} catch {
  Write-Host ("오류: " + $_.Exception.Message) -ForegroundColor Red
  exit 1
}
