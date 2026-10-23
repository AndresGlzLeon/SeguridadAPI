<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="csrf-token" content="{{ csrf_token() }}" />
    <title>API Security Lab — OrganiRack+</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@400;500;600;700&display=swap" />
    <style>
        :root {
            --bg-main: #090d16;
            --bg-panel: #0f1523;
            --bg-card: #151d30;
            --border: #1e293b;
            --text-main: #f8fafc;
            --text-muted: #64748b;
            --accent-blue: #2563eb;
            --status-ok: #10b981;
            --status-error: #ef4444;
            --status-warn: #f59e0b;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            background-color: var(--bg-main);
            color: var(--text-main);
            font-family: 'Inter', sans-serif;
            height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        header {
            height: 60px;
            background: var(--bg-panel);
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            padding: 0 20px;
            gap: 24px;
        }
        .brand {
            display: flex;
            align-items: center;
            gap: 10px;
            padding-right: 20px;
            border-right: 1px solid var(--border);
        }
        .logo-box {
            width: 32px;
            height: 32px;
            background: var(--accent-blue);
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
        }
        .brand h1 { font-size: 16px; font-weight: 700; }
        .badge-version {
            background: rgba(16, 185, 129, 0.15);
            color: var(--status-ok);
            font-size: 11px;
            font-weight: 600;
            padding: 3px 8px;
            border-radius: 12px;
            border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .scenarios-nav { display: flex; gap: 10px; flex-wrap: wrap; }
        .scenario-btn {
            background: var(--bg-card);
            border: 1px solid var(--border);
            color: #cbd5e1;
            padding: 8px 14px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.2s;
        }
        .scenario-btn:hover { border-color: #475569; color: #fff; }
        .scenario-btn.active {
            background: rgba(37, 99, 235, 0.2);
            border-color: var(--accent-blue);
            color: #fff;
            box-shadow: 0 0 12px rgba(37, 99, 235, 0.3);
        }
        .dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
        .dot-v1 { background: #64748b; }
        .dot-v2 { background: #f59e0b; }
        .dot-v3 { background: #10b981; }
        .dot-v4 { background: #ef4444; }
        .dot-v5 { background: #f97316; }

        .workspace {
            display: grid;
            grid-template-columns: 350px 1fr;
            flex: 1;
            overflow: hidden;
        }
        aside {
            background: var(--bg-panel);
            border-right: 1px solid var(--border);
            padding: 18px;
            display: flex;
            flex-direction: column;
            gap: 18px;
            overflow-y: auto;
        }
        .section-title {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.08em;
            color: var(--text-muted);
            text-transform: uppercase;
            border-left: 3px solid var(--accent-blue);
            padding-left: 8px;
            margin-bottom: 10px;
        }
        .auth-badge {
            background: var(--bg-card);
            border: 1px solid var(--border);
            padding: 10px 12px;
            border-radius: 8px;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 10px;
        }
        .auth-badge.logged { border-color: rgba(16, 185, 129, 0.4); background: rgba(16, 185, 129, 0.08); }
        .quick-users {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-bottom: 10px;
        }
        .user-card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            padding: 8px 10px;
            border-radius: 8px;
            cursor: pointer;
            text-align: left;
            transition: all 0.15s;
        }
        .user-card:hover { border-color: var(--accent-blue); }
        .user-card .role-name { font-size: 11px; font-weight: 700; display: flex; align-items: center; gap: 5px; }
        .user-card .user-mail { font-size: 10px; color: var(--text-muted); margin-top: 2px; }

        .input-field, .select-field {
            width: 100%;
            background: var(--bg-main);
            border: 1px solid var(--border);
            color: var(--text-main);
            padding: 9px 12px;
            border-radius: 8px;
            font-size: 12px;
            margin-bottom: 8px;
            font-family: 'JetBrains Mono', monospace;
        }
        .btn-primary {
            width: 100%;
            background: var(--accent-blue);
            color: #fff;
            border: none;
            padding: 10px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 13px;
            cursor: pointer;
        }
        .btn-danger {
            width: 100%;
            background: rgba(239, 68, 68, 0.15);
            color: var(--status-error);
            border: 1px solid rgba(239, 68, 68, 0.3);
            padding: 8px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 12px;
            cursor: pointer;
            margin-top: 6px;
        }
        .control-box {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }
        .mode-presets {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
        }
        .preset-btn {
            background: var(--bg-main);
            border: 1px solid var(--border);
            color: var(--text-muted);
            padding: 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
        }
        .preset-btn.active-fail {
            background: rgba(239, 68, 68, 0.18);
            border-color: var(--status-error);
            color: #fca5a5;
        }
        .preset-btn.active-pass {
            background: rgba(16, 185, 129, 0.18);
            border-color: var(--status-ok);
            color: #6ee7b7;
        }
        .control-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            background: var(--bg-main);
            border: 1px solid var(--border);
            padding: 8px 10px;
            border-radius: 8px;
            font-size: 12px;
        }
        .control-label { font-size: 11px; font-weight: 600; color: #94a3b8; }
        .control-val { font-family: 'JetBrains Mono', monospace; font-size: 10px; color: #cbd5e1; margin-top: 2px; }
        .switch {
            width: 38px;
            height: 20px;
            background: #334155;
            border-radius: 20px;
            position: relative;
            cursor: pointer;
            border: none;
            transition: background 0.2s;
            flex-shrink: 0;
        }
        .switch::after {
            content: '';
            width: 14px;
            height: 14px;
            background: #fff;
            border-radius: 50%;
            position: absolute;
            top: 3px;
            left: 3px;
            transition: transform 0.2s;
        }
        .switch.on { background: var(--status-ok); }
        .switch.on::after { transform: translateX(18px); }

        .order-input {
            width: 65px;
            background: var(--bg-card);
            border: 1px solid #475569;
            color: #fff;
            padding: 4px 8px;
            border-radius: 6px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            text-align: center;
        }
        .execute-btn {
            width: 100%;
            background: linear-gradient(90deg, #0284c7, #2563eb);
            color: #fff;
            border: none;
            padding: 13px;
            border-radius: 10px;
            font-weight: 700;
            font-size: 14px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(37, 99, 235, 0.35);
        }
        main {
            display: flex;
            flex-direction: column;
            background: #060911;
            overflow: hidden;
        }
        .console-header {
            height: 42px;
            background: var(--bg-panel);
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 16px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            color: var(--text-muted);
        }
        .win-dots { display: flex; gap: 6px; align-items: center; }
        .win-dot { width: 10px; height: 10px; border-radius: 50%; }
        .clear-btn {
            background: transparent;
            border: 1px solid var(--border);
            color: var(--text-muted);
            padding: 4px 10px;
            border-radius: 6px;
            font-size: 11px;
            cursor: pointer;
        }
        #console-output {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            display: flex;
            flex-direction: column;
            gap: 14px;
        }
        .log-card {
            background: #0d1322;
            border: 1px solid var(--border);
            border-left: 4px solid var(--accent-blue);
            border-radius: 8px;
            padding: 14px;
            line-height: 1.5;
        }
        .log-card.ok { border-left-color: var(--status-ok); }
        .log-card.err { border-left-color: var(--status-error); }
        .log-card.warn { border-left-color: var(--status-warn); }

        .log-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .badge-status { padding: 3px 8px; border-radius: 6px; font-weight: 700; font-size: 11px; }
        .badge-ok { background: rgba(16, 185, 129, 0.15); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
        .badge-err { background: rgba(239, 68, 68, 0.15); color: #f87171; border: 1px solid rgba(239, 68, 68, 0.3); }
        .badge-warn { background: rgba(245, 158, 11, 0.15); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.3); }

        .headers-line { color: #94a3b8; font-size: 11px; margin-bottom: 8px; }
        .missing-line { color: #fbbf24; font-size: 11px; margin-bottom: 8px; }
        pre.json-box {
            background: #060911;
            border: 1px solid #1e293b;
            padding: 10px;
            border-radius: 6px;
            color: #e2e8f0;
            overflow-x: auto;
            font-size: 11px;
            margin-bottom: 8px;
        }
        .note-line { color: #38bdf8; font-size: 11px; }
    </style>
</head>
<body>

    <header>
        <div class="brand">
            <div class="logo-box">🔒</div>
            <h1>OrganiRack+</h1>
            <span class="badge-version">Security Lab v2.3</span>
        </div>

        <nav class="scenarios-nav">
            <button class="scenario-btn" id="btn-v1" onclick="selectScenario('v1')"><span class="dot dot-v1"></span> V1 Sin Seguridad</button>
            <button class="scenario-btn active" id="btn-v2" onclick="selectScenario('v2')"><span class="dot dot-v2"></span> V2 API Key (App)</button>
            <button class="scenario-btn" id="btn-v3" onclick="selectScenario('v3')"><span class="dot dot-v3"></span> V3 Sanctum / JWT (Usuario)</button>
            <button class="scenario-btn" id="btn-v4" onclick="selectScenario('v4')"><span class="dot dot-v4"></span> V4 BOLA/IDOR y Roles</button>
            <button class="scenario-btn" id="btn-v5" onclick="selectScenario('v5')"><span class="dot dot-v5"></span> V5 Rate Limit (Catálogo Pesado)</button>
        </nav>
    </header>

    <div class="workspace">
        <aside>
            <!-- SESIÓN -->
            <div>
                <div class="section-title">1. Identidad de Usuario (Sanctum)</div>
                <div class="auth-badge" id="auth-badge">
                    <span id="auth-text">🔴 Sin autenticar</span>
                    <span id="auth-role" style="font-weight:700; color:#38bdf8;"></span>
                </div>

                <div class="quick-users">
                    <div class="user-card" onclick="fillUser('admin@organirack.com', 'password')">
                        <div class="role-name"><span style="color:#a855f7;">●</span> ADMIN</div>
                        <div class="user-mail">Dueño de Orden #1</div>
                    </div>
                    <div class="user-card" onclick="fillUser('almacenista1@organirack.com', 'password')">
                        <div class="role-name"><span style="color:#38bdf8;">●</span> ALMAC. 1</div>
                        <div class="user-mail">No es dueño de #1</div>
                    </div>
                </div>

                <input type="text" id="login-user" class="input-field" placeholder="Correo o usuario" value="almacenista1@organirack.com" />
                <input type="password" id="login-pass" class="input-field" placeholder="Contraseña" value="password" />
                <button class="btn-primary" id="btn-login" onclick="doLogin()">🔑 Iniciar Sesión</button>
                <button class="btn-danger" id="btn-logout" style="display:none;" onclick="doLogout()">⏏ Cerrar Sesión</button>
            </div>

            <!-- CONTROLES DEL ESCENARIO -->
            <div>
                <div class="section-title">2. Configuración de la Prueba</div>
                <div class="control-box">
                    <div style="font-size:11px; color:#cbd5e1; line-height:1.4;" id="scenario-desc">
                        Verifica que la petición provenga de la App oficial mediante el header X-API-KEY.
                    </div>

                    <div class="control-row" style="flex-direction:column; align-items:stretch; gap:6px;">
                        <span class="control-label">MODO DE DEMOSTRACIÓN:</span>
                        <div class="mode-presets">
                            <button class="preset-btn" id="preset-without" onclick="setMode('without')">🔓 SIN CONTROL</button>
                            <button class="preset-btn active-pass" id="preset-with" onclick="setMode('with')">🛡️ CON CONTROL</button>
                        </div>
                    </div>

                    <!-- Switch API Key -->
                    <div class="control-row" id="row-apikey">
                        <div>
                            <div class="control-label">ENVIAR X-API-KEY (Identidad App)</div>
                            <div class="control-val">{{ config('app.api_key') ? substr(config('app.api_key'), 0, 14).'...' : '(Desde .env)' }}</div>
                        </div>
                        <button class="switch on" id="toggle-apikey" onclick="toggleSwitch(this)"></button>
                    </div>

                    <!-- Switch Bearer Token -->
                    <div class="control-row" id="row-token" style="display:none;">
                        <div>
                            <div class="control-label">ENVIAR BEARER TOKEN (JWT)</div>
                            <div class="control-val" id="token-status-text">Identidad del empleado</div>
                        </div>
                        <button class="switch on" id="toggle-token" onclick="toggleSwitch(this)"></button>
                    </div>

                    <!-- Controles exclusivos de V4 BOLA/IDOR -->
                    <div id="row-v4-options" style="display:none; flex-direction:column; gap:8px;">
                        <div class="control-row" style="flex-direction:column; align-items:stretch; gap:6px;">
                            <span class="control-label">ACCIÓN INTRUSIVA A PROBAR:</span>
                            <select id="v4-action-type" class="select-field" style="margin-bottom:0;">
                                <option value="order">📄 Ver Orden Ajena #1 (BOLA / IDOR)</option>
                                <option value="delete_product">🗑️ Eliminar Producto #1 siendo Almacenista</option>
                            </select>
                        </div>

                        <div class="control-row">
                            <div>
                                <div class="control-label">ID DEL RECURSO OBJETIVO</div>
                                <div class="control-val">Orden #1 es de Admin / Almac. 5</div>
                            </div>
                            <input type="number" id="input-resource-id" class="order-input" value="1" min="1" />
                        </div>

                        <div class="control-row">
                            <div>
                                <div class="control-label">POLICY EN SERVIDOR</div>
                                <div class="control-val">Validar dueño y rol Spatie</div>
                            </div>
                            <button class="switch on" id="toggle-policy" onclick="toggleSwitch(this)"></button>
                        </div>
                    </div>

                    <!-- Controles exclusivos de V5 Rate Limiter -->
                    <div id="row-v5-options" style="display:none; flex-direction:column; gap:8px;">
                        <div class="control-row">
                            <div>
                                <div class="control-label">THROTTLE (3 req/min) EN SERVIDOR</div>
                                <div class="control-val">Protege GET /security/heavy-products</div>
                            </div>
                            <button class="switch on" id="toggle-throttle" onclick="toggleSwitch(this)"></button>
                        </div>
                        <!-- NUEVO CONTROL: Número de peticiones en ráfaga -->
                        <div class="control-row">
                            <div>
                                <div class="control-label">NÚMERO DE PETICIONES (RÁFAGA)</div>
                                <div class="control-val">Define cuántas consultas lanzar</div>
                            </div>
                            <input type="number" id="input-burst-count" class="order-input" value="4" min="1" max="50" />
                        </div>
                    </div>
                </div>
            </div>

            <button class="execute-btn" id="btn-execute" onclick="executeScenario()">▶ Ejecutar Prueba</button>
        </aside>

        <main>
            <div class="console-header">
                <div class="win-dots">
                    <span class="win-dot" style="background:#ef4444;"></span>
                    <span class="win-dot" style="background:#f59e0b;"></span>
                    <span class="win-dot" style="background:#10b981;"></span>
                    <span style="margin-left:8px;">organirack-security-lab ~ auditoría en vivo</span>
                </div>
                <button class="clear-btn" onclick="clearConsole()">Limpiar consola</button>
            </div>

            <div id="console-output"></div>
        </main>
    </div>

    <script>
        const API_BASE = `${window.location.origin}/api`;
        const SERVER_API_KEY = @json(config('app.api_key', ''));

        const state = {
            scenario: 'v2',
            mode: 'with',
            token: null,
            user: null,
            role: null
        };

        const DESCRIPTIONS = {
            v1: 'Consulta pública sin controles. Muestra el catálogo general.',
            v2: 'API Key identifica que la petición viene de la App oficial (Nivel Dispositivo), sin importar qué usuario esté logueado.',
            v3: 'Sanctum (JWT) identifica QUÉ EMPLEADO está haciendo la petición mediante su Bearer Token personal y devuelve su perfil y rol.',
            v4: 'Demuestra qué pasa cuando un Almacenista intenta abrir una Orden que NO le pertenece (IDOR) o borrar un Producto del catálogo.',
            v5: 'Lanza múltiples consultas pesadas seguidas al catálogo de Productos para intentar saturar MySQL y prueba cómo el Rate Limiter las bloquea.'
        };

        function fillUser(email, pass) {
            document.getElementById('login-user').value = email;
            document.getElementById('login-pass').value = pass;
            doLogin();
        }

        function toggleSwitch(btn) { 
            if (btn.classList.contains('on')) {
                btn.classList.remove('on');
            } else {
                btn.classList.add('on');
            }
        }
        
        function setSwitch(id, turnOn) {
            const el = document.getElementById(id);
            if (!el) return;
            if (turnOn) {
                el.classList.add('on');
            } else {
                el.classList.remove('on');
            }
        }

        function isOn(id) { 
            return document.getElementById(id)?.classList.contains('on') ?? false; 
        }

        function selectScenario(key) {
            state.scenario = key;
            document.querySelectorAll('.scenario-btn').forEach(b => b.classList.remove('active'));
            document.getElementById(`btn-${key}`).classList.add('active');
            document.getElementById('scenario-desc').textContent = DESCRIPTIONS[key];

            document.getElementById('row-apikey').style.display     = (key === 'v2' || key === 'v3' || key === 'v5') ? 'flex' : 'none';
            document.getElementById('row-token').style.display      = (key === 'v3' || key === 'v4' || key === 'v5') ? 'flex' : 'none';
            document.getElementById('row-v4-options').style.display = (key === 'v4') ? 'flex' : 'none';
            document.getElementById('row-v5-options').style.display = (key === 'v5') ? 'flex' : 'none';

            setMode('with');
        }

        function setMode(mode) {
            state.mode = mode;
            const btnWithout = document.getElementById('preset-without');
            const btnWith = document.getElementById('preset-with');
            btnWithout.classList.remove('active-fail');
            btnWith.classList.remove('active-pass');

            if (mode === 'without') {
                btnWithout.classList.add('active-fail');
                if (state.scenario === 'v2') {
                    setSwitch('toggle-apikey', false);
                } else if (state.scenario === 'v3') {
                    setSwitch('toggle-token', false);
                    setSwitch('toggle-apikey', true);
                } else if (state.scenario === 'v4') {
                    setSwitch('toggle-token', true);
                    setSwitch('toggle-policy', false);
                } else if (state.scenario === 'v5') {
                    setSwitch('toggle-apikey', true);
                    setSwitch('toggle-token', true);
                    setSwitch('toggle-throttle', false);
                }
            } else {
                btnWith.classList.add('active-pass');
                setSwitch('toggle-apikey', true);
                setSwitch('toggle-token', true);
                setSwitch('toggle-policy', true);
                setSwitch('toggle-throttle', true);
            }
        }

        async function doLogin() {
            const identifier = document.getElementById('login-user').value.trim();
            const password = document.getElementById('login-pass').value.trim();
            const btn = document.getElementById('btn-login');
            btn.disabled = true;
            btn.textContent = '⏳ Autenticando...';

            try {
                const res = await fetch(`${API_BASE}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                    body: JSON.stringify({ email: identifier, username: identifier, password })
                });
                const data = await res.json();

                if (res.ok && data.token) {
                    state.token = data.token;
                    state.user = data.user?.email || identifier;
                    state.role = data.user?.roles?.[0]?.name || 'Almacenista';

                    document.getElementById('auth-badge').classList.add('logged');
                    document.getElementById('auth-text').textContent = `🟢 ${state.user}`;
                    document.getElementById('auth-role').textContent = state.role;
                    document.getElementById('btn-logout').style.display = 'block';

                    logCard('🔑 Sesión Iniciada', 'POST', `${API_BASE}/login`, {}, res.status, data, `Autenticado como ${state.user} (${state.role}).`);
                } else {
                    logCard('❌ Error de Login', 'POST', `${API_BASE}/login`, {}, res.status, data, 'Credenciales incorrectas.');
                }
            } finally {
                btn.disabled = false;
                btn.textContent = '🔑 Iniciar Sesión';
            }
        }

        function doLogout() {
            state.token = null; state.user = null; state.role = null;
            document.getElementById('auth-badge').classList.remove('logged');
            document.getElementById('auth-text').textContent = '🔴 Sin autenticar';
            document.getElementById('auth-role').textContent = '';
            document.getElementById('btn-logout').style.display = 'none';
        }

        function buildHeaders(useApiKey, useToken) {
            const real = { 'Accept': 'application/json' };
            const display = { 'Accept': 'application/json' };

            if (useApiKey) {
                real['X-API-KEY'] = SERVER_API_KEY;
                display['X-API-KEY'] = `${SERVER_API_KEY.substring(0, 12)}...`;
            } else {
                display['X-API-KEY'] = '❌ (Omitido)';
            }

            if (useToken) {
                if (state.token) {
                    real['Authorization'] = `Bearer ${state.token}`;
                    display['Authorization'] = `Bearer ${state.token.substring(0, 18)}...`;
                } else {
                    display['Authorization'] = '⚠️ (No has iniciado sesión)';
                }
            } else {
                display['Authorization'] = '❌ (Omitido)';
            }
            return { real, display };
        }

        async function executeScenario() {
            const btn = document.getElementById('btn-execute');
            btn.disabled = true;
            btn.textContent = '⏳ Ejecutando...';
            try {
                if (state.scenario === 'v1') await runV1();
                else if (state.scenario === 'v2') await runV2();
                else if (state.scenario === 'v3') await runV3();
                else if (state.scenario === 'v4') await runV4();
                else if (state.scenario === 'v5') await runV5();
            } finally {
                btn.disabled = false;
                btn.textContent = '▶ Ejecutar Prueba';
            }
        }

        async function runV1() {
            const url = `${API_BASE}/products?per_page=3`;
            const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
            const data = await res.json();
            logCard('V1 Catálogo Público', 'GET', url, { Accept: 'application/json' }, res.status, data, 'Endpoint abierto sin protección.');
        }

        async function runV2() {
            const url = `${API_BASE}/security/app-check`;
            const { real, display } = buildHeaders(isOn('toggle-apikey'), false);
            delete display['Authorization'];
            const res = await fetch(url, { headers: real });
            const data = await res.json();
            const note = res.status === 200
                ? '✅ X-API-KEY válida: El servidor reconoce que la petición viene de la aplicación oficial.'
                : '❌ Sin X-API-KEY: El servidor rechaza la petición (401) porque no proviene de un cliente autorizado.';
            logCard('V2 API Key (Identidad de la App)', 'GET', url, display, res.status, data, note);
        }

        async function runV3() {
            const url = `${API_BASE}/security/me`;
            const { real, display } = buildHeaders(isOn('toggle-apikey'), isOn('toggle-token'));
            const res = await fetch(url, { headers: real });
            const data = await res.json();
            const note = res.status === 200
                ? `✅ Token Sanctum válido: El servidor identifica al humano (${data.user_profile?.name}) y sus roles.`
                : '❌ Sin Bearer Token: Aunque tengas la API Key de la app, el servidor no sabe qué empleado eres (401 Unauthenticated).';
            logCard('V3 Sanctum / JWT (Identidad del Empleado)', 'GET', url, display, res.status, data, note);
        }

        async function runV4() {
            if (!state.token) {
                await fillUser('almacenista1@organirack.com', 'password');
            }
            const action = document.getElementById('v4-action-type').value;
            const id = document.getElementById('input-resource-id').value || '1';
            const policyOn = isOn('toggle-policy') ? 'on' : 'off';
            const { real, display } = buildHeaders(false, isOn('toggle-token'));
            delete display['X-API-KEY'];

            if (action === 'order') {
                const url = `${API_BASE}/security/orders/${id}?control=${policyOn}`;
                const res = await fetch(url, { headers: real });
                const data = await res.json();
                const note = res.status === 403
                    ? `🛡️ PROTECCIÓN BOLA/IDOR ACTIVA: '${state.user}' intentó espiar la Orden #${id} (que es de otro compañero) y la Policy lo bloqueó con 403 Forbidden.`
                    : (policyOn === 'off'
                        ? `⚠️ VULNERABILIDAD DEMOSTRADA (Sin Control): Con la Policy apagada, '${state.user}' pudo robar los datos de la Orden #${id} aunque NO le pertenece.`
                        : `✅ Acceso permitido porque '${state.user}' es Administrador o dueño legítimo de la Orden #${id}.`);
                logCard('V4 BOLA / IDOR — Acceso a Orden Ajena', 'GET', url, display, res.status, data, note, policyOn === 'off' && res.status === 200);
            } else {
                const url = `${API_BASE}/security/products/${id}?control=${policyOn}`;
                const res = await fetch(url, { method: 'DELETE', headers: real });
                const data = await res.json();
                const note = res.status === 403
                    ? `🛡️ PROTECCIÓN DE ROL ACTIVA: '${state.user}' (Almacenista) intentó eliminar el Producto #${id} y fue bloqueado con 403 Forbidden.`
                    : (policyOn === 'off'
                        ? `⚠️ VULNERABILIDAD DEMOSTRADA (Sin Control): Sin validación de permisos, un Almacenista pudo eliminar el Producto #${id}.`
                        : `✅ Eliminación permitida para el rol Administrador.`);
                logCard('V4 Control de Permisos — Eliminar Producto', 'DELETE', url, display, res.status, data, note, policyOn === 'off' && res.status === 200);
            }
        }

        // V5 ACTUALIZADO CON CONTROL DINÁMICO DE PETICIONES
async function runV5() {
            if (!state.token) {
                await fillUser('almacenista1@organirack.com', 'password');
            }
            const throttleOn = isOn('toggle-throttle') ? 'on' : 'off';
            const url = `${API_BASE}/security/heavy-products?control=${throttleOn}`;
            const { real, display } = buildHeaders(isOn('toggle-apikey'), isOn('toggle-token'));

            const totalRequests = parseInt(document.getElementById('input-burst-count').value) || 4;
            let blockedCount = 0;
            let passedCount = 0;
            let lastBlockedData = null;

            for (let i = 1; i <= totalRequests; i++) {
                const res = await fetch(url, { headers: real });
                const data = await res.json();
                
                if (res.status === 429) {
                    blockedCount++;
                    if (blockedCount === 1) lastBlockedData = data; // Guardamos el primer error para mostrar el JSON
                } else {
                    passedCount++;
                    // Mostramos individualmente solo las primeras 3 para no saturar la UI
                    if (i <= 3) {
                        let note = throttleOn === 'off' 
                            ? `⚠️ Petición #${i} sin Rate Limiter: Consulta pesada a MySQL ejecutada sin freno.`
                            : `✅ Petición #${i} permitida (dentro del límite de 3 req/min).`;
                        logCard(`V5 Rate Limiter [Req #${i}]`, 'GET', url, display, res.status, data, note, throttleOn === 'off');
                    }
                }
            }

            // Tarjeta de resumen final
            if (blockedCount > 0) {
                let note = `🛑 RÁFAGA DETENIDA: ${blockedCount} peticiones de ${totalRequests} fueron BLOQUEADAS en seco por el Rate Limiter.`;
                logCard(`V5 Rate Limiter [Resumen de Bloqueos]`, 'GET', url, display, 429, lastBlockedData, note, false);
            } else if (passedCount > 3) {
                let note = `⚠️ ALERTA DoS: Las ${totalRequests} peticiones entraron de golpe al servidor y saturaron MySQL porque el control estaba apagado.`;
                logCard(`V5 Rate Limiter [Resumen de Impacto]`, 'GET', url, display, 200, { alerta: "Catálogo consultado masivamente" }, note, true);
            }
        }

        function logCard(title, method, url, headers, status, data, note, isVulnerableWarning = false) {
            const out = document.getElementById('console-output');
            const isOk = status >= 200 && status < 300;
            const card = document.createElement('div');
            card.className = `log-card ${isVulnerableWarning ? 'warn' : (isOk ? 'ok' : 'err')}`;

            const headersHtml = Object.entries(headers)
                .map(([k, v]) => `<strong>${k}:</strong> ${v}`)
                .join(' &nbsp;|&nbsp; ');

            const badgeClass = isVulnerableWarning ? 'badge-warn' : (isOk ? 'badge-ok' : 'badge-err');
            const badgeIcon  = isVulnerableWarning ? '⚠️ VULNERABLE' : (isOk ? '✅' : '🛑');

            card.innerHTML = `
                <div class="log-top">
                    <span style="font-weight:700; color:#f8fafc;">▶ ${title} &nbsp;—&nbsp; <span style="color:#38bdf8;">${method} ${url}</span></span>
                    <span class="badge-status ${badgeClass}">${badgeIcon} HTTP ${status}</span>
                </div>
                <div class="headers-line">📡 Headers: ${headersHtml || '(Petición pública)'}</div>
                <pre class="json-box">${JSON.stringify(data, null, 2)}</pre>
                <div class="note-line">${note}</div>
            `;
            out.appendChild(card);
            out.scrollTop = out.scrollHeight;
        }

        function clearConsole() {
            document.getElementById('console-output').innerHTML = '';
        }

        selectScenario('v2');
    </script>
</body>
</html>