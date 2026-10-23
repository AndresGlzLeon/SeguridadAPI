<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="csrf-token" content="{{ csrf_token() }}" />
    <title>Security Lab — OrganiRack+</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap" />
    <style>
        :root {
            --bg:        #0a0a0f;
            --surface:   #111118;
            --card:      #18181f;
            --border:    rgba(255,255,255,0.07);
            --border-hi: rgba(255,255,255,0.13);
            --text:      #f0f0f5;
            --muted:     #6b7280;
            --subtle:    #374151;
            --teal:      #00d4aa;
            --teal-dim:  rgba(0,212,170,0.12);
            --teal-glow: rgba(0,212,170,0.25);
            --red:       #f87171;
            --red-dim:   rgba(248,113,113,0.1);
            --amber:     #fbbf24;
            --amber-dim: rgba(251,191,36,0.1);
            --mono:      'JetBrains Mono', monospace;
            --sans:      'IBM Plex Sans', system-ui, sans-serif;
        }

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            background: var(--bg);
            color: var(--text);
            font-family: var(--sans);
            font-size: 13px;
            height: 100vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        header {
            height: 52px;
            background: var(--surface);
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            padding: 0 18px;
            gap: 20px;
            flex-shrink: 0;
        }

        .brand {
            display: flex;
            align-items: center;
            gap: 9px;
            padding-right: 18px;
            border-right: 1px solid var(--border);
            flex-shrink: 0;
        }
        .logo-box {
            width: 28px;
            height: 28px;
            background: var(--teal-dim);
            border: 1px solid rgba(0,212,170,0.3);
            border-radius: 7px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
        }
        .brand-name {
            font-size: 14px;
            font-weight: 600;
            letter-spacing: -0.01em;
            color: var(--text);
        }
        .brand-sub {
            font-size: 11px;
            color: var(--muted);
            font-family: var(--mono);
        }

        .scenarios-nav { display: flex; gap: 6px; flex-wrap: wrap; }
        .scenario-btn {
            background: transparent;
            border: 1px solid var(--border);
            color: var(--muted);
            padding: 6px 13px;
            border-radius: 6px;
            font-size: 12px;
            font-family: var(--sans);
            font-weight: 500;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 7px;
            transition: color 0.15s, border-color 0.15s, background 0.15s;
            white-space: nowrap;
        }
        .scenario-btn:hover { border-color: var(--border-hi); color: var(--text); }
        .scenario-btn.active {
            background: var(--teal-dim);
            border-color: rgba(0,212,170,0.4);
            color: var(--teal);
        }
        .dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
        .dot-v1 { background: var(--subtle); }
        .dot-v2 { background: var(--amber); }
        .dot-v3 { background: var(--teal); }
        .dot-v4 { background: var(--red); }
        .dot-v5 { background: #f97316; }

        .workspace {
            display: grid;
            grid-template-columns: 320px 1fr;
            flex: 1;
            overflow: hidden;
        }

        aside {
            background: var(--surface);
            border-right: 1px solid var(--border);
            padding: 14px;
            display: flex;
            flex-direction: column;
            gap: 14px;
            overflow-y: auto;
        }

        .section-label {
            font-size: 10px;
            font-weight: 600;
            font-family: var(--mono);
            color: var(--muted);
            margin-bottom: 8px;
        }

        .auth-badge {
            background: var(--card);
            border: 1px solid var(--border);
            padding: 9px 11px;
            border-radius: 7px;
            font-size: 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-bottom: 9px;
            transition: border-color 0.2s, background 0.2s;
        }
        .auth-badge.logged {
            border-color: rgba(0,212,170,0.3);
            background: rgba(0,212,170,0.06);
        }
        .auth-role { font-weight: 600; color: var(--teal); font-size: 11px; }

        .quick-users { display: grid; grid-template-columns: 1fr 1fr; gap: 7px; margin-bottom: 9px; }
        .user-card {
            background: var(--card);
            border: 1px solid var(--border);
            padding: 8px 10px;
            border-radius: 7px;
            cursor: pointer;
            transition: border-color 0.15s;
        }
        .user-card:hover { border-color: var(--border-hi); }
        .user-card .uc-role { font-size: 11px; font-weight: 600; display: flex; align-items: center; gap: 5px; }
        .user-card .uc-note { font-size: 10px; color: var(--muted); margin-top: 2px; }

        .input-field, .select-field {
            width: 100%;
            background: var(--bg);
            border: 1px solid var(--border);
            color: var(--text);
            padding: 8px 11px;
            border-radius: 7px;
            font-size: 12px;
            margin-bottom: 7px;
            font-family: var(--mono);
            outline: none;
            transition: border-color 0.15s;
        }
        .input-field:focus, .select-field:focus { border-color: var(--border-hi); }
        .select-field { margin-bottom: 0; }

        .btn-login {
            width: 100%;
            background: var(--card);
            color: var(--text);
            border: 1px solid var(--border-hi);
            padding: 9px;
            border-radius: 7px;
            font-weight: 500;
            font-size: 12px;
            font-family: var(--sans);
            cursor: pointer;
            transition: background 0.15s;
        }
        .btn-login:hover { background: var(--border); }
        .btn-logout {
            width: 100%;
            background: transparent;
            color: var(--red);
            border: 1px solid rgba(248,113,113,0.2);
            padding: 7px;
            border-radius: 7px;
            font-size: 12px;
            font-family: var(--sans);
            cursor: pointer;
            margin-top: 5px;
        }

        .control-box {
            background: var(--card);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 12px;
            display: flex;
            flex-direction: column;
            gap: 9px;
        }
        .scenario-desc {
            font-size: 11px;
            color: var(--muted);
            line-height: 1.5;
        }

        .mode-presets { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
        .preset-btn {
            background: var(--bg);
            border: 1px solid var(--border);
            color: var(--muted);
            padding: 7px 8px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 500;
            font-family: var(--sans);
            cursor: pointer;
            transition: all 0.15s;
        }
        .preset-btn.active-fail {
            background: var(--red-dim);
            border-color: rgba(248,113,113,0.3);
            color: var(--red);
        }
        .preset-btn.active-pass {
            background: var(--teal-dim);
            border-color: rgba(0,212,170,0.3);
            color: var(--teal);
        }

        .control-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 10px;
            background: var(--bg);
            border: 1px solid var(--border);
            padding: 8px 10px;
            border-radius: 7px;
        }
        .control-row.col { flex-direction: column; align-items: stretch; gap: 7px; }
        .ctrl-label { font-size: 11px; color: #9ca3af; }
        .ctrl-val { font-family: var(--mono); font-size: 10px; color: var(--muted); margin-top: 2px; }

        .switch {
            width: 34px;
            height: 18px;
            background: var(--subtle);
            border-radius: 18px;
            position: relative;
            cursor: pointer;
            border: none;
            transition: background 0.2s;
            flex-shrink: 0;
        }
        .switch::after {
            content: '';
            width: 12px;
            height: 12px;
            background: #fff;
            border-radius: 50%;
            position: absolute;
            top: 3px;
            left: 3px;
            transition: transform 0.2s;
        }
        .switch.on { background: var(--teal); }
        .switch.on::after { transform: translateX(16px); }

        .order-input {
            width: 60px;
            background: var(--card);
            border: 1px solid var(--border-hi);
            color: var(--text);
            padding: 4px 8px;
            border-radius: 6px;
            font-family: var(--mono);
            font-size: 12px;
            text-align: center;
        }

        .execute-btn {
            width: 100%;
            background: var(--teal);
            color: #000;
            border: none;
            padding: 11px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 13px;
            font-family: var(--sans);
            cursor: pointer;
            box-shadow: 0 0 20px var(--teal-glow);
            transition: opacity 0.15s, box-shadow 0.15s;
        }
        .execute-btn:hover { box-shadow: 0 0 28px rgba(0,212,170,0.4); }
        .execute-btn:disabled { opacity: 0.5; cursor: not-allowed; }

        main {
            display: flex;
            flex-direction: column;
            background: var(--bg);
            overflow: hidden;
        }
        .console-header {
            height: 40px;
            background: var(--surface);
            border-bottom: 1px solid var(--border);
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 14px;
            font-family: var(--mono);
            font-size: 11px;
            color: var(--muted);
            flex-shrink: 0;
        }
        .win-dots { display: flex; gap: 6px; align-items: center; }
        .win-dot { width: 9px; height: 9px; border-radius: 50%; }
        .clear-btn {
            background: transparent;
            border: 1px solid var(--border);
            color: var(--muted);
            padding: 3px 9px;
            border-radius: 5px;
            font-size: 11px;
            font-family: var(--mono);
            cursor: pointer;
            transition: border-color 0.15s;
        }
        .clear-btn:hover { border-color: var(--border-hi); color: var(--text); }

        #console-output {
            flex: 1;
            padding: 16px;
            overflow-y: auto;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .log-card {
            background: var(--card);
            border: 1px solid var(--border);
            border-left: 3px solid var(--border-hi);
            border-radius: 7px;
            padding: 12px 14px;
            font-family: var(--mono);
            font-size: 11px;
            line-height: 1.5;
        }
        .log-card.ok  { border-left-color: var(--teal); }
        .log-card.err { border-left-color: var(--red); }
        .log-card.warn { border-left-color: var(--amber); }

        .log-top {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 7px;
        }
        .log-title { font-weight: 600; color: var(--text); }
        .log-endpoint { color: #60a5fa; font-size: 10px; margin-top: 2px; }

        .badge-status {
            padding: 2px 8px;
            border-radius: 5px;
            font-size: 10px;
            font-weight: 600;
            white-space: nowrap;
        }
        .badge-ok   { background: var(--teal-dim);  color: var(--teal); border: 1px solid rgba(0,212,170,0.25); }
        .badge-err  { background: var(--red-dim);   color: var(--red);  border: 1px solid rgba(248,113,113,0.25); }
        .badge-warn { background: var(--amber-dim); color: var(--amber); border: 1px solid rgba(251,191,36,0.25); }

        .log-headers { color: var(--subtle); font-size: 10px; margin-bottom: 8px; }

        pre.json-box {
            background: var(--bg);
            border: 1px solid var(--border);
            padding: 9px 11px;
            border-radius: 6px;
            color: #c8c8d4;
            overflow-x: auto;
            font-size: 10px;
            margin-bottom: 8px;
        }
        .log-note { color: #38bdf8; font-size: 10px; }
        .log-note.warn-note { color: var(--amber); }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--subtle); border-radius: 3px; }
    </style>
</head>
<body>

<header>
    <div class="brand">
        <div class="logo-box">🔒</div>
        <div>
            <div class="brand-name">OrganiRack+</div>
            <div class="brand-sub">security lab</div>
        </div>
    </div>

    <nav class="scenarios-nav">
        <button class="scenario-btn" id="btn-v1" onclick="selectScenario('v1')">
            <span class="dot dot-v1"></span> Sin Seguridad
        </button>
        <button class="scenario-btn" id="btn-v2" onclick="selectScenario('v2')">
            <span class="dot dot-v2"></span> API Key
        </button>
        <button class="scenario-btn" id="btn-v3" onclick="selectScenario('v3')">
            <span class="dot dot-v3"></span> Sanctum / JWT
        </button>
        <button class="scenario-btn" id="btn-v4" onclick="selectScenario('v4')">
            <span class="dot dot-v4"></span> BOLA / IDOR
        </button>
        <button class="scenario-btn" id="btn-v5" onclick="selectScenario('v5')">
            <span class="dot dot-v5"></span> Rate Limiter
        </button>
    </nav>
</header>

<div class="workspace">
    <aside>
        <div>
            <div class="section-label">Identidad de usuario</div>
            <div class="auth-badge" id="auth-badge">
                <span id="auth-text">Sin sesión activa</span>
                <span class="auth-role" id="auth-role"></span>
            </div>

            <div class="quick-users">
                <div class="user-card" onclick="fillUser('admin@organirack.com','password')">
                    <div class="uc-role"><span style="color:#a78bfa;">●</span> Admin</div>
                    <div class="uc-note">Dueño de Orden #1</div>
                </div>
                <div class="user-card" onclick="fillUser('almacenista1@organirack.com','password')">
                    <div class="uc-role"><span style="color:var(--teal);">●</span> Almacenista 1</div>
                    <div class="uc-note">No es dueño de #1</div>
                </div>
            </div>

            <input type="text"     id="login-user" class="input-field"  placeholder="Correo"      value="almacenista1@organirack.com" />
            <input type="password" id="login-pass" class="input-field"  placeholder="Contraseña"  value="password" />
            <button class="btn-login"  id="btn-login"  onclick="doLogin()">Iniciar sesión</button>
            <button class="btn-logout" id="btn-logout" onclick="doLogout()" style="display:none;">Cerrar sesión</button>
        </div>

        <div>
            <div class="section-label">Configuración de prueba</div>
            <div class="control-box">
                <p class="scenario-desc" id="scenario-desc"></p>

                <div class="control-row col">
                    <span class="ctrl-label">Modo de demostración</span>
                    <div class="mode-presets">
                        <button class="preset-btn" id="preset-without" onclick="setMode('without')">Sin control</button>
                        <button class="preset-btn active-pass" id="preset-with" onclick="setMode('with')">Con control</button>
                    </div>
                </div>

                <div class="control-row" id="row-apikey">
                    <div>
                        <div class="ctrl-label">Enviar X-API-KEY</div>
                        <div class="ctrl-val">{{ config('app.api_key') ? substr(config('app.api_key'),0,14).'…' : '(desde .env)' }}</div>
                    </div>
                    <button class="switch on" id="toggle-apikey" onclick="toggleSwitch(this)"></button>
                </div>

                <div class="control-row" id="row-token" style="display:none;">
                    <div>
                        <div class="ctrl-label">Enviar Bearer Token</div>
                        <div class="ctrl-val" id="token-status-text">Identidad del empleado</div>
                    </div>
                    <button class="switch on" id="toggle-token" onclick="toggleSwitch(this)"></button>
                </div>

                <div id="row-v4-options" style="display:none; flex-direction:column; gap:8px;">
                    <div class="control-row col">
                        <span class="ctrl-label">Acción a probar</span>
                        <select id="v4-action-type" class="select-field">
                            <option value="order">Ver Orden ajena #1 (BOLA / IDOR)</option>
                            <option value="delete_product">Eliminar Producto #1 siendo Almacenista</option>
                        </select>
                    </div>
                    <div class="control-row">
                        <div>
                            <div class="ctrl-label">ID del recurso objetivo</div>
                            <div class="ctrl-val">Orden #1 pertenece a Admin</div>
                        </div>
                        <input type="number" id="input-resource-id" class="order-input" value="1" min="1" />
                    </div>
                    <div class="control-row">
                        <div>
                            <div class="ctrl-label">Policy en servidor</div>
                            <div class="ctrl-val">Valida dueño y rol (Spatie)</div>
                        </div>
                        <button class="switch on" id="toggle-policy" onclick="toggleSwitch(this)"></button>
                    </div>
                </div>

                <div id="row-v5-options" style="display:none; flex-direction:column; gap:8px;">
                    <div class="control-row">
                        <div>
                            <div class="ctrl-label">Throttle (3 req/min)</div>
                            <div class="ctrl-val">GET /security/heavy-products</div>
                        </div>
                        <button class="switch on" id="toggle-throttle" onclick="toggleSwitch(this)"></button>
                    </div>
                    <div class="control-row">
                        <div>
                            <div class="ctrl-label">Peticiones en ráfaga</div>
                            <div class="ctrl-val">Cuántas consultas lanzar</div>
                        </div>
                        <input type="number" id="input-burst-count" class="order-input" value="4" min="1" max="50" />
                    </div>
                </div>
            </div>
        </div>

        <button class="execute-btn" id="btn-execute" onclick="executeScenario()">
            ▶ Ejecutar prueba
        </button>
    </aside>

    <main>
        <div class="console-header">
            <div class="win-dots">
                <span class="win-dot" style="background:#ef4444;"></span>
                <span class="win-dot" style="background:#f59e0b;"></span>
                <span class="win-dot" style="background:var(--teal);"></span>
                <span style="margin-left:10px;">organirack — auditoría en vivo</span>
            </div>
            <button class="clear-btn" onclick="clearConsole()">limpiar</button>
        </div>
        <div id="console-output"></div>
    </main>
</div>

<script>
    const API_BASE = `${window.location.origin}/api`;
    const SERVER_API_KEY = @json(config('app.api_key', ''));

    const state = { scenario: 'v2', mode: 'with', token: null, user: null, role: null };

    const DESCRIPTIONS = {
        v1: 'Endpoint abierto sin ningún control. Devuelve el catálogo general de productos.',
        v2: 'La API Key identifica que la petición viene de la app oficial (nivel dispositivo), independientemente del usuario autenticado.',
        v3: 'Sanctum identifica al empleado mediante su Bearer Token personal y devuelve su perfil y roles.',
        v4: 'Demuestra qué pasa cuando un Almacenista accede a una Orden que no le pertenece (IDOR) o intenta eliminar un producto sin permisos.',
        v5: 'Lanza múltiples consultas pesadas en ráfaga para intentar saturar MySQL y verifica cómo el Rate Limiter las detiene.'
    };

    function fillUser(email, pass) {
        document.getElementById('login-user').value = email;
        document.getElementById('login-pass').value = pass;
        doLogin();
    }

    function toggleSwitch(btn) {
        btn.classList.toggle('on');
    }

    function setSwitch(id, on) {
        const el = document.getElementById(id);
        if (!el) return;
        on ? el.classList.add('on') : el.classList.remove('on');
    }

    function isOn(id) { return document.getElementById(id)?.classList.contains('on') ?? false; }

    function selectScenario(key) {
        state.scenario = key;
        document.querySelectorAll('.scenario-btn').forEach(b => b.classList.remove('active'));
        document.getElementById(`btn-${key}`).classList.add('active');
        document.getElementById('scenario-desc').textContent = DESCRIPTIONS[key];

        document.getElementById('row-apikey').style.display     = ['v2','v3','v5'].includes(key) ? 'flex' : 'none';
        document.getElementById('row-token').style.display      = ['v3','v4','v5'].includes(key) ? 'flex' : 'none';
        document.getElementById('row-v4-options').style.display = key === 'v4' ? 'flex' : 'none';
        document.getElementById('row-v5-options').style.display = key === 'v5' ? 'flex' : 'none';

        setMode('with');
    }

    function setMode(mode) {
        state.mode = mode;
        document.getElementById('preset-without').classList.remove('active-fail');
        document.getElementById('preset-with').classList.remove('active-pass');

        if (mode === 'without') {
            document.getElementById('preset-without').classList.add('active-fail');
            if (state.scenario === 'v2') { setSwitch('toggle-apikey', false); }
            else if (state.scenario === 'v3') { setSwitch('toggle-token', false); setSwitch('toggle-apikey', true); }
            else if (state.scenario === 'v4') { setSwitch('toggle-token', true); setSwitch('toggle-policy', false); }
            else if (state.scenario === 'v5') { setSwitch('toggle-apikey', true); setSwitch('toggle-token', true); setSwitch('toggle-throttle', false); }
        } else {
            document.getElementById('preset-with').classList.add('active-pass');
            setSwitch('toggle-apikey', true);
            setSwitch('toggle-token', true);
            setSwitch('toggle-policy', true);
            setSwitch('toggle-throttle', true);
        }
    }

    async function doLogin() {
        const identifier = document.getElementById('login-user').value.trim();
        const password   = document.getElementById('login-pass').value.trim();
        const btn = document.getElementById('btn-login');
        btn.disabled = true; btn.textContent = 'Autenticando…';

        try {
            const res  = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
                body: JSON.stringify({ email: identifier, username: identifier, password })
            });
            const data = await res.json();

            if (res.ok && data.token) {
                state.token = data.token;
                state.user  = data.user?.email || identifier;
                state.role  = data.user?.roles?.[0]?.name || 'Almacenista';

                document.getElementById('auth-badge').classList.add('logged');
                document.getElementById('auth-text').textContent = state.user;
                document.getElementById('auth-role').textContent = state.role;
                document.getElementById('btn-logout').style.display = 'block';

                logCard('Sesión iniciada', 'POST', `${API_BASE}/login`, {}, res.status, data,
                    `Autenticado como ${state.user} (${state.role}).`);
            } else {
                logCard('Error de login', 'POST', `${API_BASE}/login`, {}, res.status, data,
                    'Credenciales incorrectas o usuario no encontrado.');
            }
        } finally {
            btn.disabled = false; btn.textContent = 'Iniciar sesión';
        }
    }

    function doLogout() {
        state.token = null; state.user = null; state.role = null;
        document.getElementById('auth-badge').classList.remove('logged');
        document.getElementById('auth-text').textContent = 'Sin sesión activa';
        document.getElementById('auth-role').textContent = '';
        document.getElementById('btn-logout').style.display = 'none';
    }

    function buildHeaders(useApiKey, useToken) {
        const real    = { 'Accept': 'application/json' };
        const display = { 'Accept': 'application/json' };

        if (useApiKey) {
            real['X-API-KEY']     = SERVER_API_KEY;
            display['X-API-KEY']  = `${SERVER_API_KEY.substring(0,12)}…`;
        } else {
            display['X-API-KEY']  = '(omitido)';
        }

        if (useToken) {
            if (state.token) {
                real['Authorization']     = `Bearer ${state.token}`;
                display['Authorization']  = `Bearer ${state.token.substring(0,16)}…`;
            } else {
                display['Authorization']  = '(sin sesión activa)';
            }
        } else {
            display['Authorization'] = '(omitido)';
        }

        return { real, display };
    }

    async function executeScenario() {
        const btn = document.getElementById('btn-execute');
        btn.disabled = true; btn.textContent = 'Ejecutando…';
        try {
            if      (state.scenario === 'v1') await runV1();
            else if (state.scenario === 'v2') await runV2();
            else if (state.scenario === 'v3') await runV3();
            else if (state.scenario === 'v4') await runV4();
            else if (state.scenario === 'v5') await runV5();
        } finally {
            btn.disabled = false; btn.textContent = '▶ Ejecutar prueba';
        }
    }

    async function runV1() {
        const url = `${API_BASE}/products?per_page=3`;
        const res  = await fetch(url, { headers: { 'Accept': 'application/json' } });
        const data = await res.json();
        logCard('Catálogo público (sin control)', 'GET', url, { Accept: 'application/json' }, res.status, data,
            'Endpoint abierto — cualquier cliente puede acceder sin presentar credencial alguna.');
    }

    async function runV2() {
        const url = `${API_BASE}/security/app-check`;
        const { real, display } = buildHeaders(isOn('toggle-apikey'), false);
        delete display['Authorization'];
        const res  = await fetch(url, { headers: real });
        const data = await res.json();
        const note = res.status === 200
            ? 'X-API-KEY válida: el servidor confirma que la petición proviene de la aplicación oficial.'
            : 'Sin X-API-KEY: el servidor rechaza la petición (401) porque el cliente no está autorizado.';
        logCard('API Key — identidad de la app', 'GET', url, display, res.status, data, note);
    }

    async function runV3() {
        const url = `${API_BASE}/security/me`;
        const { real, display } = buildHeaders(isOn('toggle-apikey'), isOn('toggle-token'));
        const res  = await fetch(url, { headers: real });
        const data = await res.json();
        const note = res.status === 200
            ? `Token Sanctum válido: el servidor identifica a ${data.user_profile?.name} y sus roles.`
            : 'Sin Bearer Token: aunque la API Key sea válida, el servidor no sabe qué empleado realiza la petición (401).';
        logCard('Sanctum / JWT — identidad del empleado', 'GET', url, display, res.status, data, note);
    }

    async function runV4() {
        if (!state.token) await fillUser('almacenista1@organirack.com', 'password');
        const action   = document.getElementById('v4-action-type').value;
        const id       = document.getElementById('input-resource-id').value || '1';
        const policyOn = isOn('toggle-policy') ? 'on' : 'off';
        const { real, display } = buildHeaders(false, isOn('toggle-token'));
        delete display['X-API-KEY'];

        if (action === 'order') {
            const url  = `${API_BASE}/security/orders/${id}?control=${policyOn}`;
            const res  = await fetch(url, { headers: real });
            const data = await res.json();
            const note = res.status === 403
                ? `BOLA/IDOR bloqueado: '${state.user}' intentó ver la Orden #${id} (ajena) y la Policy devolvió 403.`
                : policyOn === 'off'
                    ? `Vulnerabilidad expuesta: sin Policy, '${state.user}' accedió a la Orden #${id} sin ser su dueño.`
                    : `Acceso permitido: '${state.user}' es Administrador o dueño legítimo de la Orden #${id}.`;
            logCard('BOLA / IDOR — acceso a orden ajena', 'GET', url, display, res.status, data, note,
                policyOn === 'off' && res.status === 200);
        } else {
            const url  = `${API_BASE}/security/products/${id}?control=${policyOn}`;
            const res  = await fetch(url, { method: 'DELETE', headers: real });
            const data = await res.json();
            const note = res.status === 403
                ? `Control de roles activo: '${state.user}' (Almacenista) no tiene permiso para eliminar el Producto #${id}.`
                : policyOn === 'off'
                    ? `Vulnerabilidad expuesta: sin validación de rol, un Almacenista eliminó el Producto #${id}.`
                    : `Eliminación permitida para el rol Administrador.`;
            logCard('Control de permisos — eliminar producto', 'DELETE', url, display, res.status, data, note,
                policyOn === 'off' && res.status === 200);
        }
    }

    async function runV5() {
        if (!state.token) await fillUser('almacenista1@organirack.com', 'password');
        const throttleOn     = isOn('toggle-throttle') ? 'on' : 'off';
        const url            = `${API_BASE}/security/heavy-products?control=${throttleOn}`;
        const { real, display } = buildHeaders(isOn('toggle-apikey'), isOn('toggle-token'));
        const totalRequests  = parseInt(document.getElementById('input-burst-count').value) || 4;

        for (let i = 1; i <= totalRequests; i++) {
            const res  = await fetch(url, { headers: real });
            const data = await res.json();
            let note = '';

            if (res.status === 429) {
                note = `🛑 PETICIÓN #${i}/${totalRequests} BLOQUEADA (429 Too Many Requests): El Rate Limiter cortó la conexión.`;
            } else if (throttleOn === 'off') {
                note = `⚠️ Petición #${i}/${totalRequests} sin Rate Limiter: consulta pesada a MySQL ejecutada sin restricción.`;
            } else {
                note = `✅ Petición #${i}/${totalRequests} permitida (dentro del límite de 3 req/min).`;
            }

            const isVulnerable = throttleOn === 'off' || res.status === 429;
            logCard(`Rate Limiter — req #${i}/${totalRequests}`, 'GET', url, display, res.status, data, note, isVulnerable);
            await new Promise(resolve => setTimeout(resolve, 50));
        }
    }

    function logCard(title, method, url, headers, status, data, note, isVulnerable = false) {
        const out    = document.getElementById('console-output');
        const isOk   = status >= 200 && status < 300;
        const card   = document.createElement('div');
        card.className = `log-card ${isVulnerable ? 'warn' : isOk ? 'ok' : 'err'}`;

        const headersHtml = Object.entries(headers)
            .map(([k, v]) => `<strong>${k}:</strong> ${v}`)
            .join('  ·  ');

        const badgeClass = isVulnerable ? 'badge-warn' : isOk ? 'badge-ok' : 'badge-err';
        const badgeLabel = isVulnerable ? `⚠ VULNERABLE  HTTP ${status}` : `HTTP ${status}`;

        card.innerHTML = `
            <div class="log-top">
                <div>
                    <div class="log-title">${title}</div>
                    <div class="log-endpoint">${method} ${url}</div>
                </div>
                <span class="badge-status ${badgeClass}">${badgeLabel}</span>
            </div>
            <div class="log-headers">${headersHtml || '(petición pública)'}</div>
            <pre class="json-box">${JSON.stringify(data, null, 2)}</pre>
            <div class="log-note ${isVulnerable ? 'warn-note' : ''}">${note}</div>
        `;
        out.appendChild(card);
        out.scrollTop = out.scrollHeight;
    }

    function clearConsole() { document.getElementById('console-output').innerHTML = ''; }

    selectScenario('v2');
</script>
</body>
</html>