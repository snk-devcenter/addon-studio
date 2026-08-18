[CmdletBinding()]
param(
    [switch]$Claude,
    [switch]$Codex,
    [switch]$Force
)

$assetBase = if ($env:ADDON_STUDIO_ASSET_BASE) {
    $env:ADDON_STUDIO_ASSET_BASE
} else {
    'https://github.com/snk-devcenter/addon-studio/releases/latest/download'
}

if ($Claude -eq $Codex) {
    throw 'Use exatamente uma flag: -Claude ou -Codex.'
}

function Install-ClaudePlugin {
    if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
        throw 'Claude Code não encontrado no PATH.'
    }

    & claude plugin marketplace update snk-devcenter
    if ($LASTEXITCODE -ne 0) {
        & claude plugin marketplace add snk-devcenter/addon-studio --scope user
        if ($LASTEXITCODE -ne 0) {
            throw 'Não foi possível configurar o marketplace snk-devcenter no Claude Code.'
        }
    }
    & claude plugin update addon-studio@snk-devcenter --scope user -y
    if ($LASTEXITCODE -ne 0) {
        & claude plugin install addon-studio@snk-devcenter --scope user -y
        if ($LASTEXITCODE -ne 0) {
            throw 'Não foi possível instalar o plugin addon-studio no Claude Code.'
        }
    }
    Write-Host 'Claude Code pronto. Reinicie a sessão para carregar o plugin e os agents.'
}

function Install-CodexAgents {
    $tempDir = Join-Path ([System.IO.Path]::GetTempPath()) ("addon-studio-" + [guid]::NewGuid())
    New-Item -ItemType Directory -Path $tempDir | Out-Null
    try {
        $archive = Join-Path $tempDir 'agents.zip'
        Invoke-WebRequest -Uri "$assetBase/addon-studio-codex-agents.zip" -OutFile $archive
        Expand-Archive -LiteralPath $archive -DestinationPath $tempDir

        $sourceDir = Join-Path $tempDir 'agents/codex'
        if (-not (Test-Path -Path $sourceDir -PathType Container)) {
            throw 'Artefato de agents inválido.'
        }
        $codexRoot = if ($env:CODEX_HOME) { $env:CODEX_HOME } else { Join-Path $HOME '.codex' }
        $targetDir = Join-Path $codexRoot 'agents'
        New-Item -ItemType Directory -Force -Path $targetDir | Out-Null

        $installed = 0
        $current = 0
        $preserved = 0
        foreach ($source in Get-ChildItem -Path $sourceDir -Filter '*.toml' -File) {
            $target = Join-Path $targetDir $source.Name
            if (Test-Path -Path $target -PathType Leaf) {
                if ((Get-FileHash $source.FullName).Hash -eq (Get-FileHash $target).Hash) {
                    $current++
                    continue
                }
                if (-not $Force) {
                    $preserved++
                    Write-Host "Preservado: $target (use -Force para substituir)."
                    continue
                }
            }
            Copy-Item -Path $source.FullName -Destination $target -Force
            $installed++
        }
        Write-Host "Agents instalados/atualizados: $installed; já atuais: $current; preservados: $preserved."
    } finally {
        Remove-Item -LiteralPath $tempDir -Recurse -Force -ErrorAction SilentlyContinue
    }
}

function Install-CodexPlugin {
    if (-not (Get-Command codex -ErrorAction SilentlyContinue)) {
        throw 'Codex CLI não encontrado no PATH.'
    }

    & codex plugin marketplace upgrade snk-devcenter
    if ($LASTEXITCODE -ne 0) {
        & codex plugin marketplace add snk-devcenter/addon-studio --ref main
        if ($LASTEXITCODE -ne 0) {
            throw 'Não foi possível configurar o marketplace snk-devcenter no Codex.'
        }
    }
    & codex plugin add addon-studio@snk-devcenter
    if ($LASTEXITCODE -ne 0) {
        throw 'Não foi possível instalar o plugin addon-studio no Codex.'
    }
    Install-CodexAgents
    Write-Host 'Codex pronto. Abra uma nova sessão para carregar o plugin e os agents.'
}

if ($Claude) {
    Install-ClaudePlugin
} else {
    Install-CodexPlugin
}
