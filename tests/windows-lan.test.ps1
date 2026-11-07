$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot '../tools/windows-lan/lan-firewall.ps1')
function Assert-Equal($Actual, $Expected) {
  if ($Actual -ne $Expected) { throw "Expected '$Expected', got '$Actual'" }
}
Assert-Equal (ConvertTo-PskoCidr '192.168.7.123/24').Cidr '192.168.7.0/24'
Assert-Equal (ConvertTo-PskoCidr '10.255.255.255/8').Cidr '10.0.0.0/8'
Assert-Equal (ConvertTo-PskoCidr '172.31.255.255/12').Cidr '172.16.0.0/12'
Assert-Equal (ConvertTo-PskoCidr '26.120.3.5/24').Cidr '26.120.3.0/24'
Assert-Equal (ConvertTo-PskoCidr '192.168.1.4/32').Count 1
Assert-Equal (ConvertTo-PskoCidr '192.168.7.123/24').FirewallAddress '192.168.7.0/255.255.255.0'
Assert-Equal (ConvertTo-PskoCidr '192.168.1.4/32').FirewallAddress '192.168.1.4'
foreach ($bad in @('0.0.0.0/0','192.168.0.0/15','172.0.0.0/8','26.0.0.0/7','8.8.8.8/32','127.0.0.1/32','::1/128','192.168.0.256/24','192.168.0.1/33','192.168.0.1','192.168.0.0/24,10.0.0.0/8','192.168.0.0/24;whoami')) {
  $rejected = $false
  try { ConvertTo-PskoCidr $bad | Out-Null } catch { $rejected = $true }
  if (-not $rejected) { throw "Accepted invalid CIDR: $bad" }
}
Assert-Equal (ConvertTo-PskoPortRange "Start Port : 49152`nNumber of Ports : 16384") '49152-65535'
Assert-Equal (ConvertTo-PskoPortRange "aaa : 50000`nbbb : 1000") '50000-50999'
foreach ($bad in @('', 'first : 65000', "a : 65000`nb : 1000", "a : 49152`nb : 0")) {
  $rejected = $false
  try { ConvertTo-PskoPortRange $bad | Out-Null } catch { $rejected = $true }
  if (-not $rejected) { throw 'Accepted invalid dynamic port range' }
}

# Assert the rule's complete scope without granting any network access.
$global:created = $null
function Get-NetFirewallRule { param($Name, $ErrorAction) if ($global:created) { [pscustomobject]@{ Name=$Name; Enabled='True'; Direction='Inbound'; Action='Allow'; Profile='Any'; Group='PokeSurvivor LAN CIDR' } } }
function New-NetFirewallRule {
  param($Name,$DisplayName,$Group,$Description,$Program,$Direction,$Action,$Protocol,$LocalPort,$RemoteAddress,$Profile,$Enabled,$ErrorAction)
  $global:created = @{} + $PSBoundParameters
}
function Get-NetFirewallApplicationFilter { param([Parameter(ValueFromPipeline)]$InputObject) [pscustomobject]@{ Program=$global:created.Program } }
function Get-NetFirewallPortFilter { param([Parameter(ValueFromPipeline)]$InputObject) [pscustomobject]@{ Protocol=$global:created.Protocol; LocalPort=$global:created.LocalPort } }
function Get-NetFirewallAddressFilter { param([Parameter(ValueFromPipeline)]$InputObject) [pscustomobject]@{ RemoteAddress=$global:created.RemoteAddress } }
function Remove-NetFirewallRule { throw 'Unexpected removal' }
$ruleName = Add-PskoLanRule '192.168.7.0/24' 'C:\Chrome\chrome.exe' '49152-65535'
Assert-Equal $global:created.RemoteAddress '192.168.7.0/24'
Assert-Equal $global:created.Program 'C:\Chrome\chrome.exe'
Assert-Equal $global:created.Protocol 'UDP'
Assert-Equal $global:created.Direction 'Inbound'
Assert-Equal $global:created.LocalPort '49152-65535'
Assert-Equal $global:created.Group 'PokeSurvivor LAN CIDR'
Assert-Equal (Add-PskoLanRule '192.168.7.0/24' 'C:\Chrome\chrome.exe' '49152-65535') $ruleName
$global:created.RemoteAddress = '192.168.7.0/255.255.255.0'
Assert-Equal (Add-PskoLanRule '192.168.7.0/24' 'C:\Chrome\chrome.exe' '49152-65535') $ruleName
$rejected = $false
try { Add-PskoLanRule '192.168.7.0/24' 'C:\Other\chrome.exe' '49152-65535' | Out-Null } catch { $rejected=$true }
if (-not $rejected) { throw 'Existing conflicting rule was accepted' }

# A new rule that fails verification is rolled back; a conflicting existing one is not.
$global:created = $null
$global:removed = @()
function Get-NetFirewallApplicationFilter { param([Parameter(ValueFromPipeline)]$InputObject) [pscustomobject]@{ Program='C:\Wrong\chrome.exe' } }
function Remove-NetFirewallRule { param($Name) $global:removed += $Name; $global:created=$null }
$rejected = $false
try { Add-PskoLanRule '192.168.7.0/24' 'C:\Chrome\chrome.exe' '49152-65535' | Out-Null } catch { $rejected=$true }
if (-not $rejected) { throw 'Failed verification was ignored' }
Assert-Equal $global:removed.Count 1
Assert-Equal $global:removed[0] $ruleName

# Removal requires explicit confirmation and preserves older single-peer rules.
$global:rules = @(
  [pscustomobject]@{ Name=$ruleName; DisplayName='CIDR test'; Group='PokeSurvivor LAN CIDR' },
  [pscustomobject]@{ Name='PSKO-Chrome-LAN-Peer-192-168-7-2'; DisplayName='Old peer'; Group='Other' }
)
$global:removed = @()
function Get-NetFirewallRule { param($Name,$Group,$ErrorAction) $global:rules | Where-Object { if ($Name) { $_.Name -eq $Name } else { $_.Group -eq $Group } } }
function Remove-NetFirewallRule { param($Name) $global:removed += $Name; $global:rules = @($global:rules | Where-Object Name -ne $Name) }
$global:answer = 'no'
function Read-Host { param($Prompt) $global:answer }
Remove-PskoLanRules
Assert-Equal $global:removed.Count 0
$global:answer = 'DELETE'
Remove-PskoLanRules
Assert-Equal $global:removed.Count 1
Assert-Equal $global:removed[0] $ruleName
Assert-Equal $global:rules.Count 1
Assert-Equal $global:rules[0].Name 'PSKO-Chrome-LAN-Peer-192-168-7-2'
Write-Output 'Windows LAN helper tests passed (no firewall settings changed).'
