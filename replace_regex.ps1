$filePath = "c:\Users\23353247239\Desktop\antigravity\EDP_Dashboard\index.html"
# Read with UTF8 encoding explicitly
$content = [System.IO.File]::ReadAllText($filePath, [System.Text.Encoding]::UTF8)

# Normalize line endings to LF for regex consistency
$content = $content -replace "`r`n", "`n"

# 1. Social Area
$pattern1 = '(<input\s+type="text"\s+name="vinculos_sociales"\s+placeholder="[^"]+">\s*</div>)'
$insert1 = '
                                                        <div class="form-field">
                                                            <label>Frecuencia de Visitas / Contacto</label>
                                                            <input type="text" name="frecuencia_visitas" placeholder="Ej: Quincenal / Semanal">
                                                        </div>
                                                        <div class="form-field">
                                                            <label>Calificación de Conducta (Social)</label>
                                                            <select name="calif_conducta_soc">
                                                                <option value="">Seleccione calificación...</option>
                                                                <option value="Ejemplar">Ejemplar</option>
                                                                <option value="Muy Buena">Muy Buena</option>
                                                                <option value="Buena">Buena</option>
                                                                <option value="Regular">Regular</option>
                                                                <option value="Mala">Mala</option>
                                                            </select>
                                                        </div>'

if ($content -match $pattern1) {
    Write-Host "Found pattern 1 (Social)"
    $content = [regex]::Replace($content, $pattern1, "`$1$insert1")
} else {
    Write-Warning "Pattern 1 not found"
}

# 2. Psicologia Area
$pattern2 = '(<input\s+type="text"\s+name="modalidad_psico"\s+placeholder="[^"]+">\s*</div>)'
$insert2 = '
                                                        <div class="form-field">
                                                            <label>Asistencia a Sesiones (%)</label>
                                                            <input type="text" name="asistencia_psicologia" placeholder="Ej: 90%">
                                                        </div>
                                                        <div class="form-field">
                                                            <label>Nivel de Adhesión</label>
                                                            <select name="adhesion_psico">
                                                                <option value="">Seleccione adhesión...</option>
                                                                <option value="Favorable">Favorable</option>
                                                                <option value="Aceptable">Aceptable</option>
                                                                <option value="Regular">Regular</option>
                                                                <option value="Escasa / Nula">Escasa / Nula</option>
                                                            </select>
                                                        </div>
                                                        <div class="form-field">
                                                            <label>Calificación de Conducta (Psicológica)</label>
                                                            <select name="calif_conducta_psi">
                                                                <option value="">Seleccione calificación...</option>
                                                                <option value="Ejemplar">Ejemplar</option>
                                                                <option value="Muy Buena">Muy Buena</option>
                                                                <option value="Buena">Buena</option>
                                                                <option value="Regular">Regular</option>
                                                                <option value="Mala">Mala</option>
                                                            </select>
                                                        </div>'

if ($content -match $pattern2) {
    Write-Host "Found pattern 2 (Psicologia)"
    $content = [regex]::Replace($content, $pattern2, "`$1$insert2")
} else {
    Write-Warning "Pattern 2 not found"
}

# 3. Laboral Area
$pattern3 = '(<input\s+type="text"\s+name="curso_laboral"\s+placeholder="[^"]+">\s*</div>)'
$insert3 = '
                                                        <div class="form-field">
                                                            <label>Estado del Curso</label>
                                                            <select name="estado_laboral">
                                                                <option value="">Seleccione estado...</option>
                                                                <option value="En Curso">En Curso</option>
                                                                <option value="Completado">Completado</option>
                                                                <option value="Abandonado">Abandonado</option>
                                                            </select>
                                                        </div>
                                                        <div class="form-field">
                                                            <label>Asistencia (%)</label>
                                                            <input type="text" name="asistencia_laboral" placeholder="Ej: 100%">
                                                        </div>'

if ($content -match $pattern3) {
    Write-Host "Found pattern 3 (Laboral)"
    $content = [regex]::Replace($content, $pattern3, "`$1$insert3")
} else {
    Write-Warning "Pattern 3 not found"
}

# 4. Restaurativa Area
$pattern4 = '(<input\s+type="text"\s+name="estado_restaurativa"\s+placeholder="[^"]+">\s*</div>)'
$insert4 = '
                                                        <div class="form-field">
                                                            <label>Asistencia a Encuentros (%)</label>
                                                            <input type="text" name="asistencia_restaurativa" placeholder="Ej: 83%">
                                                        </div>
                                                        <div class="form-field">
                                                            <label>Mediaciones y Logros</label>
                                                            <input type="text" name="mediaciones_restaurativa" placeholder="Ej: 1 Exitosa (Sin Sanción)">
                                                        </div>'

if ($content -match $pattern4) {
    Write-Host "Found pattern 4 (Restaurativa)"
    $content = [regex]::Replace($content, $pattern4, "`$1$insert4")
} else {
    Write-Warning "Pattern 4 not found"
}

# Restore CRLF line endings
$content = $content -replace "`n", "`r`n"

# Write back in UTF-8
[System.IO.File]::WriteAllText($filePath, $content, [System.Text.Encoding]::UTF8)
Write-Host "Regex HTML replacement done."
