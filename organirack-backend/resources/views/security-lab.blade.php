<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="csrf-token" content="{{ csrf_token() }}" />
    <title>API Security Lab — OrganiRack+</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Inter:wght@300;400;500;600;700&display=swap" />
    <style>
        /* =============================================
           DESIGN TOKENS — SECURITY LAB THEME
        ============================================= */
        :root {
            --bg-base:       #0a0d14;
            --bg-panel:      #0f1320;
            --bg-card:       #141928;
            --bg-input:      #1a2035;
            --bg-hover:      #1e2740;
            --border:        #1f2d4a;
            --border-bright: #2a3f6a;
            --accent-blue:   #3b7fff;
            --accent-cyan:   #00d4ff;
            --accent-green:  #00e88a;
            --accent-yellow: #ffc845;
            --accent-red:    #ff4560;
            --accent-purple: #9b59f5;
            --accent-orange: #ff8c42;
            --text-primary:  #e4eaf6;
            --text-secondary:#8899bb;
            --text-muted:    #4a5a7a;
            --status-ok:     #00e88a;
            --status-warn:   #ffc845;
            --status-error:  #ff4560;
            --glow-blue:     0 0 20px rgba(59,127,255,0.25);
            --glow-green:    0 0 20px rgba(0,232,138,0.25);
            --glow-red:      0 0 20px rgba(255,69,96,0.25);
            --glow-yellow:   0 0 20px rgba(255,200,69,0.25);
            --radius-sm:     6px;
            --radius-md:     10px;
            --radius-lg:     14px;
        }

        /* =============================================
           RESET & BASE
        ============================================= */
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'Inter', system-ui, sans-serif;
            background: var(--bg-base);
            color: var(--text-primary);
            height: 100vh;
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }

        /* =============================================
           TOP BAR
        ============================================= */
        #topbar {
            background: var(--bg-panel);
            border-bottom: 1px solid var(--border);
            padding: 0 20px;
            height: 60px;
            display: flex;
            align-items: center;
            gap: 12px;
            flex-shrink: 0;
            position: relative;
            z-index: 10;
        }

        #topbar .brand {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-right: 20px;
        }

        #topbar .brand .logo-icon {
            width: 32px;
            height: 32px;
            background: linear-gradient(135deg, var(--accent-blue), var(--accent-cyan));
            border-radius: var(--radius-sm);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 16px;
        }

        #topbar .brand h1 {
            font-size: 15px;
            font-weight: 700;
            color: var(--text-primary);
            letter-spacing: 0.5px;
        }

        #topbar .brand span {
            font-size: 11px;
            color: var(--accent-cyan);
            font-family: 'JetBrains Mono', monospace;
            font-weight: 600;
            background: rgba(0,212,255,0.1);
            padding: 2px 8px;
            border-radius: 20px;
            border: 1px solid rgba(0,212,255,0.2);
        }

        #topbar .divider {
            width: 1px;
            height: 28px;
            background: var(--border);
            margin: 0 8px;
        }

        .scenario-btn {
            display: flex;
            align-items: center;
            gap: 7px;
            padding: 8px 14px;
            border-radius: var(--radius-md);
            border: 1px solid var(--border);
            background: var(--bg-card);
            color: var(--text-secondary);
            font-family: 'Inter', sans-serif;
            font-size: 12.5px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
        }

        .scenario-btn:hover {
            background: var(--bg-hover);
            border-color: var(--border-bright);
            color: var(--text-primary);
            transform: translateY(-1px);
        }

        .scenario-btn.active {
            border-color: var(--accent-blue);
            background: rgba(59,127,255,0.12);
            color: var(--accent-blue);
            box-shadow: var(--glow-blue);
        }

        .scenario-btn .dot {
            width: 8px;
            height: 8px;
            border-radius: 50%;
            flex-shrink: 0;
        }

        .btn-v1 .dot { background: var(--text-muted); }
        .btn-v2 .dot { background: var(--accent-yellow); }
        .btn-v3 .dot { background: var(--accent-green); }
        .btn-v4 .dot { background: var(--accent-red); }
        .btn-v5 .dot { background: var(--accent-orange); }

        .btn-v1.active { border-color: var(--text-secondary); background: rgba(136,153,187,0.1); color: var(--text-primary); box-shadow: none; }
        .btn-v2.active { border-color: var(--accent-yellow); background: rgba(255,200,69,0.1); color: var(--accent-yellow); box-shadow: var(--glow-yellow); }
        .btn-v3.active { border-color: var(--accent-green); background: rgba(0,232,138,0.1); color: var(--accent-green); box-shadow: var(--glow-green); }
        .btn-v4.active { border-color: var(--accent-red); background: rgba(255,69,96,0.1); color: var(--accent-red); box-shadow: var(--glow-red); }
        .btn-v5.active { border-color: var(--accent-orange); background: rgba(255,140,66,0.1); color: var(--accent-orange); box-shadow: 0 0 20px rgba(255,140,66,0.25); }

        .spacer { flex: 1; }

        #live-indicator {
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 11px;
            color: var(--text-muted);
            font-family: 'JetBrains Mono', monospace;
        }

        #live-indicator .pulse {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            background: var(--accent-green);
            animation: pulse-anim 2s infinite;
        }

        @keyframes pulse-anim {
            0%, 100% { opacity: 1; transform: scale(1); }
            50% { opacity: 0.4; transform: scale(0.8); }
        }

        /* =============================================
           MAIN LAYOUT
        ============================================= */
        #main {
            display: grid;
            grid-template-columns: 300px 1fr;
            flex: 1;
            overflow: hidden;
        }

        /* =============================================
           LEFT PANEL — SESSION
        ============================================= */
        #left-panel {
            background: var(--bg-panel);
            border-right: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            overflow-y: auto;
            scrollbar-width: thin;
            scrollbar-color: var(--border) transparent;
        }

        .panel-section {
            padding: 16px;
            border-bottom: 1px solid var(--border);
        }

        .panel-section:last-child { border-bottom: none; }

        .scenario-summary {
            background: rgba(59, 127, 255, 0.08);
            border: 1px solid rgba(59, 127, 255, 0.25);
            border-radius: var(--radius-md);
            padding: 12px 10px;
            margin: -4px 0 12px;
        }

        .scenario-summary .summary-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 8px;
            margin-bottom: 6px;
        }

        .scenario-summary .summary-label {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 1.4px;
            color: var(--accent-cyan);
            text-transform: uppercase;
        }

        .scenario-summary .summary-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            min-width: 28px;
            height: 22px;
            padding: 0 8px;
            border-radius: 999px;
            font-size: 10px;
            font-weight: 700;
            background: rgba(0, 212, 255, 0.14);
            border: 1px solid rgba(0, 212, 255, 0.28);
            color: var(--accent-cyan);
            font-family: 'JetBrains Mono', monospace;
        }

        .scenario-summary p {
            font-size: 11px;
            line-height: 1.55;
            color: var(--text-secondary);
        }

        .tiny-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            border-radius: 999px;
            border: 1px solid rgba(255,255,255,0.08);
            background: rgba(255,255,255,0.02);
            color: var(--text-secondary);
            padding: 4px 8px;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.08em;
        }

        .section-title {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: var(--text-muted);
            margin-bottom: 12px;
            display: flex;
            align-items: center;
            gap: 6px;
        }

        .section-title::before {
            content: '';
            display: block;
            width: 3px;
            height: 12px;
            border-radius: 2px;
            background: var(--accent-blue);
        }

        /* Auth status badge */
        #auth-status {
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 10px 12px;
            border-radius: var(--radius-md);
            background: var(--bg-input);
            border: 1px solid var(--border);
            margin-bottom: 12px;
            font-size: 12px;
        }

        #auth-status .status-dot {
            width: 9px;
            height: 9px;
            border-radius: 50%;
            background: var(--status-error);
            flex-shrink: 0;
            transition: background 0.3s;
        }

        #auth-status.logged-in .status-dot { background: var(--status-ok); }

        #auth-status .status-text {
            color: var(--text-secondary);
            flex: 1;
        }

        /* Form inputs */
        .lab-input {
            width: 100%;
            background: var(--bg-input);
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            color: var(--text-primary);
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            padding: 9px 12px;
            outline: none;
            transition: border-color 0.2s;
            margin-bottom: 8px;
        }

        .lab-input:focus {
            border-color: var(--accent-blue);
            background: rgba(59,127,255,0.05);
        }

        .lab-input::placeholder { color: var(--text-muted); }

        /* Quick-fill buttons */
        .quick-fill-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 6px;
            margin-bottom: 10px;
        }

        .quick-btn {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
            gap: 2px;
            padding: 8px 10px;
            border-radius: var(--radius-sm);
            border: 1px solid var(--border);
            background: var(--bg-card);
            cursor: pointer;
            transition: all 0.2s;
            text-align: left;
            width: 100%;
        }

        .quick-btn:hover {
            border-color: var(--border-bright);
            background: var(--bg-hover);
            transform: translateY(-1px);
        }

        .quick-btn .qb-role {
            font-size: 10px;
            font-weight: 700;
            letter-spacing: 0.5px;
            text-transform: uppercase;
        }

        .quick-btn .qb-email {
            font-size: 10px;
            color: var(--text-muted);
            font-family: 'JetBrains Mono', monospace;
        }

        .quick-btn.admin .qb-role   { color: var(--accent-purple); }
        .quick-btn.almac .qb-role  { color: var(--accent-cyan); }
        .quick-btn.almac2 .qb-role { color: var(--accent-blue); }

        /* Buttons */
        .lab-btn {
            width: 100%;
            padding: 10px 16px;
            border-radius: var(--radius-sm);
            border: none;
            font-family: 'Inter', sans-serif;
            font-size: 13px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 7px;
        }

        .lab-btn-primary {
            background: linear-gradient(135deg, var(--accent-blue), #2563eb);
            color: #fff;
        }

        .lab-btn-primary:hover {
            background: linear-gradient(135deg, #5b9fff, var(--accent-blue));
            transform: translateY(-1px);
            box-shadow: var(--glow-blue);
        }

        .lab-btn-danger {
            background: rgba(255,69,96,0.15);
            color: var(--accent-red);
            border: 1px solid rgba(255,69,96,0.3);
            margin-top: 6px;
        }

        .lab-btn-danger:hover {
            background: rgba(255,69,96,0.25);
            transform: translateY(-1px);
        }

        /* Token display */
        #token-display {
            font-family: 'JetBrains Mono', monospace;
            font-size: 10px;
            color: var(--accent-green);
            background: rgba(0,232,138,0.06);
            border: 1px solid rgba(0,232,138,0.15);
            border-radius: var(--radius-sm);
            padding: 8px 10px;
            word-break: break-all;
            line-height: 1.5;
            min-height: 40px;
            max-height: 80px;
            overflow-y: auto;
            margin-bottom: 10px;
            display: none;
        }

        #token-display.visible { display: block; }

        /* Scenario config */
        .config-row {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 8px 10px;
            border-radius: var(--radius-sm);
            background: var(--bg-card);
            border: 1px solid var(--border);
            margin-bottom: 6px;
            font-size: 11.5px;
        }

        .state-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
            margin-top: 10px;
        }

        .state-card {
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            padding: 10px 10px 8px;
            min-height: 110px;
        }

        .state-card.vulnerable {
            border-color: rgba(255, 69, 96, 0.35);
            background: rgba(255, 69, 96, 0.04);
        }

        .state-card.protected {
            border-color: rgba(0, 232, 138, 0.35);
            background: rgba(0, 232, 138, 0.04);
        }

        .state-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 6px;
            margin-bottom: 8px;
        }

        .state-tag {
            font-size: 9px;
            font-weight: 700;
            letter-spacing: 1px;
            text-transform: uppercase;
            padding: 4px 7px;
            border-radius: 999px;
            border: 1px solid transparent;
        }

        .state-card.vulnerable .state-tag {
            background: rgba(255, 69, 96, 0.12);
            color: var(--status-error);
            border-color: rgba(255, 69, 96, 0.2);
        }

        .state-card.protected .state-tag {
            background: rgba(0, 232, 138, 0.12);
            color: var(--status-ok);
            border-color: rgba(0, 232, 138, 0.2);
        }

        .state-card p {
            margin: 0;
            font-size: 10.5px;
            line-height: 1.5;
            color: var(--text-secondary);
        }

        .config-row label {
            color: var(--text-muted);
            font-size: 10px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            white-space: nowrap;
            width: 65px;
            flex-shrink: 0;
        }

        .config-row .config-val {
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            color: var(--text-secondary);
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }

        .config-toggle {
            width: 30px;
            height: 16px;
            border-radius: 8px;
            border: none;
            cursor: pointer;
            position: relative;
            transition: background 0.2s;
            flex-shrink: 0;
        }

        .config-toggle::after {
            content: '';
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #fff;
            position: absolute;
            top: 2px;
            left: 2px;
            transition: transform 0.2s;
        }

        .config-toggle.on { background: var(--accent-green); }
        .config-toggle.on::after { transform: translateX(14px); }
        .config-toggle.off { background: var(--text-muted); }

        .resource-input {
            background: var(--bg-input);
            border: 1px solid var(--border);
            border-radius: 4px;
            color: var(--text-primary);
            font-family: 'JetBrains Mono', monospace;
            font-size: 11px;
            padding: 4px 8px;
            width: 70px;
            outline: none;
        }

        .resource-input:focus { border-color: var(--accent-blue); }

        /* Execute button */
        #execute-btn {
            width: 100%;
            padding: 12px;
            border-radius: var(--radius-md);
            border: none;
            font-family: 'Inter', sans-serif;
            font-size: 14px;
            font-weight: 700;
            cursor: pointer;
            background: linear-gradient(135deg, var(--accent-blue), var(--accent-cyan));
            color: #000;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            transition: all 0.2s;
            letter-spacing: 0.3px;
        }

        #execute-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 30px rgba(59,127,255,0.4);
        }

        #execute-btn:active { transform: translateY(0); }

        #execute-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
            transform: none;
        }

        /* =============================================
           RIGHT PANEL — CONSOLE
        ============================================= */
        #right-panel {
            background: var(--bg-base);
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        #console-header {
            background: var(--bg-panel);
            border-bottom: 1px solid var(--border);
            padding: 12px 20px;
            display: flex;
            align-items: center;
            gap: 12px;
            flex-shrink: 0;
        }

        .console-dots {
            display: flex;
            gap: 6px;
        }

        .console-dots span {
            width: 10px;
            height: 10px;
            border-radius: 50%;
        }

        .console-dots .d1 { background: #ff5f57; }
        .console-dots .d2 { background: #febe2d; }
        .console-dots .d3 { background: #2ac940; }

        #console-title {
            font-size: 12px;
            font-family: 'JetBrains Mono', monospace;
            color: var(--text-secondary);
        }

        .spacer { flex: 1; }

        #clear-console-btn {
            font-size: 11px;
            color: var(--text-muted);
            background: none;
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            padding: 4px 10px;
            cursor: pointer;
            font-family: 'Inter', sans-serif;
            transition: all 0.2s;
        }

        #clear-console-btn:hover {
            color: var(--text-secondary);
            border-color: var(--border-bright);
        }

        #console-body {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12.5px;
            line-height: 1.7;
            scrollbar-width: thin;
            scrollbar-color: var(--border) transparent;
        }

        /* Console entries */
        .console-entry {
            margin-bottom: 24px;
            animation: fadeIn 0.3s ease;
        }

        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(6px); }
            to   { opacity: 1; transform: translateY(0); }
        }

        .entry-header {
            display: flex;
            align-items: center;
            gap: 10px;
            margin-bottom: 10px;
            padding-bottom: 8px;
            border-bottom: 1px solid var(--border);
        }

        .entry-timestamp {
            font-size: 10px;
            color: var(--text-muted);
        }

        .entry-scenario {
            font-size: 11px;
            font-weight: 700;
            letter-spacing: 0.5px;
            padding: 2px 8px;
            border-radius: 20px;
        }

        .status-badge {
            font-size: 13px;
            font-weight: 700;
            padding: 3px 12px;
            border-radius: var(--radius-sm);
            display: inline-flex;
            align-items: center;
            gap: 5px;
        }

        .status-2xx { background: rgba(0,232,138,0.15); color: var(--status-ok); border: 1px solid rgba(0,232,138,0.3); }
        .status-3xx { background: rgba(59,127,255,0.15); color: var(--accent-blue); border: 1px solid rgba(59,127,255,0.3); }
        .status-4xx { background: rgba(255,69,96,0.15); color: var(--status-error); border: 1px solid rgba(255,69,96,0.3); }
        .status-429 { background: rgba(255,140,66,0.15); color: var(--accent-orange); border: 1px solid rgba(255,140,66,0.3); }

        .section-block {
            margin-bottom: 12px;
        }

        .block-label {
            font-size: 9.5px;
            font-weight: 700;
            letter-spacing: 1.5px;
            text-transform: uppercase;
            color: var(--text-muted);
            margin-bottom: 6px;
        }

        .block-content {
            background: var(--bg-panel);
            border: 1px solid var(--border);
            border-radius: var(--radius-sm);
            padding: 12px 14px;
            overflow-x: auto;
        }

        .request-line {
            color: var(--accent-cyan);
            margin-bottom: 4px;
        }

        .header-line {
            display: flex;
            gap: 8px;
            margin-bottom: 2px;
        }

        .header-key   { color: var(--accent-yellow); }
        .header-colon { color: var(--text-muted); }
        .header-val   { color: var(--text-primary); }

        .header-val.auth-val    { color: var(--accent-green); }
        .header-val.apikey-val  { color: var(--accent-purple); }
        .header-val.absent      { color: var(--status-error); font-style: italic; }

        pre.json-output {
            white-space: pre-wrap;
            word-break: break-word;
            color: var(--text-primary);
            font-size: 12px;
            line-height: 1.6;
        }

        .json-key      { color: #79c0ff; }
        .json-string   { color: #a5d6ff; }
        .json-number   { color: var(--accent-green); }
        .json-bool     { color: var(--accent-orange); }
        .json-null     { color: var(--text-muted); }

        /* Error / info messages */
        .console-msg {
            padding: 10px 14px;
            border-radius: var(--radius-sm);
            font-size: 12px;
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .console-msg.info    { background: rgba(59,127,255,0.08); color: var(--accent-blue); border: 1px solid rgba(59,127,255,0.2); }
        .console-msg.error   { background: rgba(255,69,96,0.08); color: var(--status-error); border: 1px solid rgba(255,69,96,0.2); }
        .console-msg.success { background: rgba(0,232,138,0.08); color: var(--status-ok); border: 1px solid rgba(0,232,138,0.2); }
        .console-msg.warn    { background: rgba(255,200,69,0.08); color: var(--accent-yellow); border: 1px solid rgba(255,200,69,0.2); }

        /* Spinner */
        .spinner {
            width: 14px;
            height: 14px;
            border: 2px solid rgba(59,127,255,0.3);
            border-top-color: var(--accent-blue);
            border-radius: 50%;
            animation: spin 0.7s linear infinite;
            display: inline-block;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        /* Welcome screen */
        #welcome-screen {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            height: 100%;
            gap: 16px;
            color: var(--text-muted);
            text-align: center;
            padding: 40px;
        }

        #welcome-screen .shield-icon {
            font-size: 56px;
            opacity: 0.3;
        }

        #welcome-screen h2 {
            font-size: 20px;
            font-weight: 300;
            color: var(--text-secondary);
        }

        #welcome-screen p {
            font-size: 13px;
            max-width: 400px;
            line-height: 1.6;
        }

        .steps-list {
            text-align: left;
            font-size: 12px;
            line-height: 2;
        }

        .steps-list span {
            display: block;
        }

        .steps-list .step-done { color: var(--accent-green); }
        .steps-list .step-todo { color: var(--text-muted); }
    </style>
</head>
<body>

<!-- ===================================================
     TOP BAR — Scenario Buttons
=================================================== -->
<header id="topbar">
    <div class="brand">
        <div class="logo-icon">🔒</div>
        <h1>OrganiRack+</h1>
        <span>Security Lab v1.0</span>
    </div>

    <div class="divider"></div>

    <button class="scenario-btn btn-v1" id="btn-v1" onclick="selectScenario('v1')">
        <span class="dot"></span> V1 Sin Seguridad
    </button>
    <button class="scenario-btn btn-v2" id="btn-v2" onclick="selectScenario('v2')">
        <span class="dot"></span> V2 API Key
    </button>
    <button class="scenario-btn btn-v3" id="btn-v3" onclick="selectScenario('v3')">
        <span class="dot"></span> V3 Sanctum (JWT)
    </button>
    <button class="scenario-btn btn-v4" id="btn-v4" onclick="selectScenario('v4')">
        <span class="dot"></span> V4 BOLA/IDOR
    </button>
    <button class="scenario-btn btn-v5" id="btn-v5" onclick="selectScenario('v5')">
        <span class="dot"></span> V5 Rate Limiter
    </button>

    <div class="spacer"></div>

    <div id="live-indicator">
        <div class="pulse"></div>
        API conectada
    </div>
</header>

<!-- ===================================================
     MAIN LAYOUT
=================================================== -->
<div id="main">

    <!-- ===============================================
         LEFT PANEL — Sesión
    =============================================== -->
    <aside id="left-panel">

        <!-- Autenticación -->
        <div class="panel-section">
            <div class="section-title">Sesión Sanctum</div>

            <div id="auth-status">
                <div class="status-dot"></div>
                <div class="status-text" id="auth-label">Sin autenticar</div>
            </div>

            <div id="token-display"></div>

            <div class="quick-fill-grid">
                <button class="quick-btn admin" onclick="fillCredentials('admin@organirack.com','password')">
                    <span class="qb-role">🟣 Admin</span>
                    <span class="qb-email">admin@...</span>
                </button>
                <button class="quick-btn almac" onclick="fillCredentials('almacenista1@organirack.com','password')">
                    <span class="qb-role">🔵 Almac. 1</span>
                    <span class="qb-email">almac1@...</span>
                </button>
                <button class="quick-btn almac2" onclick="fillCredentials('almacenista2@organirack.com','password')">
                    <span class="qb-role">🔵 Almac. 2</span>
                    <span class="qb-email">almac2@...</span>
                </button>
                <button class="quick-btn almac" onclick="fillCredentials('almacenista3@organirack.com','password')">
                    <span class="qb-role">🔵 Almac. 3</span>
                    <span class="qb-email">almac3@...</span>
                </button>
            </div>

            <input type="email" class="lab-input" id="input-email" placeholder="correo@organirack.com" autocomplete="off" />
            <input type="password" class="lab-input" id="input-password" placeholder="contraseña" autocomplete="off" />

            <button class="lab-btn lab-btn-primary" id="login-btn" onclick="doLogin()">
                <span id="login-spinner"></span>
                🔑 Iniciar Sesión
            </button>

            <button class="lab-btn lab-btn-danger" id="logout-btn" onclick="doLogout()" style="display:none;">
                ⏏ Cerrar Sesión
            </button>
        </div>

        <!-- Config del escenario -->
        <div class="panel-section">
            <div class="section-title">Configuración del Escenario</div>

            <div id="scenario-empty" class="console-msg info" style="font-size:11px;">
                Selecciona un escenario en la barra superior ↑
            </div>

            <div id="scenario-summary" class="scenario-summary" style="display:none;">
                <div class="summary-head">
                    <span class="summary-label">Escenario activo</span>
                    <span class="summary-badge" id="summary-badge">V1</span>
                </div>
                <p id="summary-text">Se ejecutará una prueba de seguridad.</p>
            </div>

            <div id="scenario-config" style="display:none;">
                <!-- Dinámico -->
            </div>
        </div>

        <!-- Ejecutar -->
        <div class="panel-section">
            <button id="execute-btn" onclick="executeScenario()" disabled>
                ▶ Ejecutar Petición
            </button>
        </div>

        <!-- Guía rápida -->
        <div class="panel-section">
            <div class="section-title">Guía Rápida</div>
            <div class="steps-list" id="guide-steps">
                <span class="step-todo">① Inicia sesión con cualquier usuario</span>
                <span class="step-todo">② Selecciona un escenario</span>
                <span class="step-todo">③ Ajusta la config si es necesario</span>
                <span class="step-todo">④ Presiona ▶ Ejecutar</span>
                <span class="step-todo">⑤ Observa el resultado en la consola</span>
            </div>
        </div>
    </aside>

    <!-- ===============================================
         RIGHT PANEL — Console
    =============================================== -->
    <main id="right-panel">
        <div id="console-header">
            <div class="console-dots">
                <span class="d1"></span>
                <span class="d2"></span>
                <span class="d3"></span>
            </div>
            <span id="console-title">organirack-security-lab ~ bash</span>
            <div class="spacer"></div>
            <button id="clear-console-btn" onclick="clearConsole()">⌫ Limpiar</button>
        </div>

        <div id="console-body">
            <div id="welcome-screen">
                <div class="shield-icon">🛡️</div>
                <h2>API Security Lab — OrganiRack+</h2>
                <p>Banco de pruebas para validar seguridad en una API REST con Laravel.</p>
                <div class="steps-list">
                    <span class="step-done">✅ API Key Middleware (X-API-KEY)</span>
                    <span class="step-done">✅ Rate Limiter (throttle:3,1)</span>
                    <span class="step-done">✅ Protección BOLA/IDOR con policy por roles</span>
                    <span class="step-done">✅ Sanctum stateless + bearer token</span>
                </div>
                <div class="tiny-badge" style="margin-top:12px;">Inicia sesión → elige un caso → ejecuta</div>
            </div>
        </div>
    </main>
</div>

<!-- ===================================================
     JAVASCRIPT — Lab Logic
=================================================== -->
<script>
// =============================================
// STATE
// =============================================
const state = {
    token: null,
    userEmail: null,
    userRole: null,
    currentScenario: null,
    requestCount: 0,
};

// Detecta si estamos en localhost o en un servidor real
const BASE_URL   = window.location.origin;
const API_BASE   = BASE_URL + '/api';
const API_KEY    = 'organirack_secreto_123';
const CSRF_TOKEN = document.querySelector('meta[name="csrf-token"]')?.content ?? '';

// =============================================
// UTILS
// =============================================
function ts() {
    return new Date().toLocaleTimeString('es-MX', { hour12: false });
}

function getStatusClass(code) {
    if (code === 429) return 'status-429';
    if (code >= 200 && code < 300) return 'status-2xx';
    if (code >= 300 && code < 400) return 'status-3xx';
    return 'status-4xx';
}

function getStatusEmoji(code) {
    if (code === 200 || code === 201) return '✅';
    if (code === 401) return '🔒';
    if (code === 403) return '🚫';
    if (code === 404) return '🔍';
    if (code === 422) return '⚠️';
    if (code === 429) return '🚦';
    return '❌';
}

function syntaxHighlight(json) {
    if (typeof json !== 'string') json = JSON.stringify(json, null, 2);
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        let cls = 'json-number';
        if (/^"/.test(match)) {
            cls = /:$/.test(match) ? 'json-key' : 'json-string';
        } else if (/true|false/.test(match)) {
            cls = 'json-bool';
        } else if (/null/.test(match)) {
            cls = 'json-null';
        }
        if (cls === 'json-key') match = match.replace(/:$/, '');
        return `<span class="${cls}">${match}</span>${cls === 'json-key' ? ':' : ''}`;
    });
}

function appendToConsole(html) {
    const body = document.getElementById('console-body');
    const welcome = document.getElementById('welcome-screen');
    if (welcome) welcome.remove();
    const div = document.createElement('div');
    div.className = 'console-entry';
    div.innerHTML = html;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
}

function appendMessage(type, icon, text) {
    appendToConsole(`<div class="console-msg ${type}">${icon} ${text}</div>`);
}

function clearConsole() {
    document.getElementById('console-body').innerHTML =
        '<div style="color:var(--text-muted);font-size:12px;font-family:\'JetBrains Mono\',monospace;padding:12px;">Console cleared — ' + ts() + '</div>';
}

function renderRequest(method, url, headers, body) {
    const headerLines = Object.entries(headers).map(([k, v]) => {
        let valClass = 'header-val';
        if (k === 'Authorization') valClass += ' auth-val';
        else if (k === 'X-API-KEY') valClass += ' apikey-val';
        return `<div class="header-line">
                    <span class="header-key">${k}</span>
                    <span class="header-colon">:</span>
                    <span class="${valClass}">${v}</span>
                </div>`;
    }).join('');

    return `
    <div class="section-block">
        <div class="block-label">▸ Request</div>
        <div class="block-content">
            <div class="request-line">${method} ${url} HTTP/1.1</div>
            ${headerLines}
            ${body ? `<div style="margin-top:8px;color:var(--text-muted);">${JSON.stringify(body)}</div>` : ''}
        </div>
    </div>`;
}

function renderMissingHeaders(missing) {
    const lines = missing.map(h =>
        `<div class="header-line"><span class="header-key">${h}</span><span class="header-colon">:</span><span class="header-val absent">(ausente)</span></div>`
    ).join('');
    return `
    <div class="section-block">
        <div class="block-label">⚠️ Headers Faltantes</div>
        <div class="block-content">${lines}</div>
    </div>`;
}

function renderResponse(status, data) {
    const cls = getStatusClass(status);
    const emoji = getStatusEmoji(status);
    return `
    <div class="section-block">
        <div class="block-label">◂ Response</div>
        <span class="status-badge ${cls}" style="margin-bottom:10px;display:inline-flex;">${emoji} HTTP ${status}</span>
        <div class="block-content" style="margin-top:8px;">
            <pre class="json-output">${syntaxHighlight(data)}</pre>
        </div>
    </div>`;
}

function renderEntry(scenarioLabel, scenarioColor, method, url, headers, missingHeaders, status, data, note) {
    return `
    <div class="entry-header">
        <span class="entry-timestamp">${ts()}</span>
        <span class="entry-scenario" style="background:${scenarioColor}22;color:${scenarioColor};border:1px solid ${scenarioColor}44;">
            ${scenarioLabel}
        </span>
        <span class="status-badge ${getStatusClass(status)}" style="margin-left:auto;">
            ${getStatusEmoji(status)} ${status}
        </span>
    </div>
    ${note ? `<div class="console-msg info" style="margin-bottom:10px;font-size:11px;">ℹ️ ${note}</div>` : ''}
    ${renderRequest(method, url, headers)}
    ${missingHeaders && missingHeaders.length ? renderMissingHeaders(missingHeaders) : ''}
    ${renderResponse(status, data)}`;
}

// =============================================
// AUTH
// =============================================
function fillCredentials(email, pass) {
    document.getElementById('input-email').value = email;
    document.getElementById('input-password').value = pass;
}

async function doLogin() {
    const email = document.getElementById('input-email').value.trim();
    const pass  = document.getElementById('input-password').value.trim();

    if (!email || !pass) {
        appendMessage('error', '⚠️', 'Ingresa email y contraseña antes de continuar.');
        return;
    }

    const btn = document.getElementById('login-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Autenticando...';

    try {
        const res = await fetch(`${API_BASE}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': CSRF_TOKEN },
            body: JSON.stringify({ email, password: pass }),
        });

        const data = await res.json();

        if (res.ok && data.token) {
            state.token     = data.token;
            state.userEmail = email;
            state.userRole  = data.user?.roles?.[0]?.name ?? data.user?.name ?? email;

            // UI update
            const authEl = document.getElementById('auth-status');
            authEl.classList.add('logged-in');
            document.getElementById('auth-label').textContent = state.userRole || email;

            const tokenEl = document.getElementById('token-display');
            tokenEl.textContent = state.token.substring(0, 80) + '...';
            tokenEl.classList.add('visible');

            document.getElementById('logout-btn').style.display = 'flex';
            document.getElementById('login-btn').style.display  = 'none';

            // Guide steps
            document.querySelectorAll('.steps-list .step-todo')[0].className = 'step-done';

            appendMessage('success', '🔑', `Sesión iniciada como <strong>${email}</strong>. Token Sanctum recibido.`);
            updateExecuteBtn();
        } else {
            appendMessage('error', '❌', `Login fallido: ${data.message ?? JSON.stringify(data)}`);
        }
    } catch (err) {
        appendMessage('error', '❌', `Error de red: ${err.message}`);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '🔑 Iniciar Sesión';
    }
}

function doLogout() {
    state.token     = null;
    state.userEmail = null;
    state.userRole  = null;

    document.getElementById('auth-status').classList.remove('logged-in');
    document.getElementById('auth-label').textContent = 'Sin autenticar';
    document.getElementById('token-display').classList.remove('visible');
    document.getElementById('token-display').textContent = '';
    document.getElementById('logout-btn').style.display  = 'none';
    document.getElementById('login-btn').style.display   = 'flex';

    appendMessage('warn', '⏏', 'Sesión cerrada. Token eliminado del lab.');
    updateExecuteBtn();
}

// =============================================
// SCENARIOS
// =============================================
const SCENARIOS = {
    v1: {
        label: 'V1 Sin Seguridad',
        color: '#8899bb',
        description: 'Accede a <code>GET /api/products</code> sin token ni API Key. Este es el estado vulnerable: cualquier cliente puede consultar catálogo público.',
        before: 'Sin protección: el endpoint responde con 200 sin autenticar.',
        after: 'Estado protegido: se mantiene público solo para lectura de catálogo, sin datos sensibles ni operaciones críticas.',
    },
    v2: {
        label: 'V2 API Key',
        color: '#ffc845',
        description: 'Accede a <code>GET /api/security/status</code> con el header <code>X-API-KEY</code>. La prueba válida compara un valor ausente vs. uno correcto.',
        before: 'Sin X-API-KEY: 401 con “Acceso denegado”.',
        after: 'Con X-API-KEY válido: 200 y acceso autorizado.',
        hasApiKeyToggle: true,
    },
    v3: {
        label: 'V3 Sanctum (JWT)',
        color: '#00e88a',
        description: 'Accede a <code>GET /api/security/status</code> con Bearer Token de Sanctum + API Key. Valida autenticación stateless.',
        before: 'Sin token: 401 de autenticación.',
        after: 'Con token válido + API Key: 200 OK y usuario autenticado.',
    },
    v4: {
        label: 'V4 BOLA/IDOR',
        color: '#ff4560',
        description: 'Accede a <code>GET /api/orders/{id}</code>. El usuario debe ver solo sus órdenes o las permitidas por roles privilegiados.',
        before: 'Sin política de autorización: un usuario podría consultar una orden ajena.',
        after: 'Con policy + roles: usuario ajeno recibe 403, propietario/admin recibe 200.',
        hasOrderId: true,
    },
    v5: {
        label: 'V5 Rate Limiter',
        color: '#ff8c42',
        description: 'Envía 4 peticiones rápidas a <code>GET /api/security/ping</code>. El valor de la cuota es 3 req/minuto.',
        before: 'Sin throttle: un atacante puede hacer ráfagas ilimitadas.',
        after: 'Con throttle:3,1 la 4ta petición devuelve 429 Too Many Attempts.',
        hasBurst: true,
    },
};

function selectScenario(v) {
    state.currentScenario = v;

    // Update button states
    document.querySelectorAll('.scenario-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`btn-${v}`).classList.add('active');

    // Render config panel
    const sc = SCENARIOS[v];
    const configEl = document.getElementById('scenario-config');
    const emptyEl  = document.getElementById('scenario-empty');
    const summaryEl = document.getElementById('scenario-summary');
    const summaryBadge = document.getElementById('summary-badge');
    const summaryText = document.getElementById('summary-text');

    emptyEl.style.display  = 'none';
    configEl.style.display = 'block';
    summaryEl.style.display = 'block';
    summaryBadge.textContent = v.toUpperCase();
    summaryText.textContent = sc.description.replace(/<[^>]+>/g, '');

    let configHTML = `
        <div class="console-msg info" style="margin-bottom:10px;font-size:11px;">${sc.description}</div>
        <div class="state-grid">
            <div class="state-card vulnerable">
                <div class="state-head">
                    <span class="state-tag">Antes</span>
                    <span class="tiny-badge">Vulnerable</span>
                </div>
                <p>${sc.before}</p>
            </div>
            <div class="state-card protected">
                <div class="state-head">
                    <span class="state-tag">Ahora</span>
                    <span class="tiny-badge">Protegido</span>
                </div>
                <p>${sc.after}</p>
            </div>
        </div>
    `;

    // API Key toggle
    if (sc.hasApiKeyToggle) {
        configHTML += `
        <div class="config-row">
            <label>API KEY</label>
            <span class="config-val" id="apikey-val-display">${API_KEY}</span>
            <button class="config-toggle on" id="apikey-toggle" onclick="toggleApiKey(this)" title="Activar/desactivar API Key"></button>
        </div>`;
    }

    // Order ID input
    if (sc.hasOrderId) {
        configHTML += `
        <div class="config-row">
            <label>Order ID</label>
            <input type="number" class="resource-input" id="order-id-input" value="1" min="1" />
        </div>
        <div class="config-row" style="margin-top:0;">
            <label>USE AUTH</label>
            <span class="config-val">Bearer Token automático</span>
        </div>`;
    }

    // Burst toggle
    if (sc.hasBurst) {
        configHTML += `
        <div class="config-row">
            <label>RÁFAGA</label>
            <span class="config-val">4 peticiones consecutivas</span>
        </div>`;
    }

    // Auth indicator
    configHTML += `
    <div class="config-row" style="margin-top:6px;">
        <label>TOKEN</label>
        <span class="config-val" id="token-indicator">${state.token ? '✅ Listo' : '❌ Sin sesión'}</span>
    </div>`;

    configEl.innerHTML = configHTML;
    updateExecuteBtn();
}

function toggleApiKey(btn) {
    btn.classList.toggle('on');
    btn.classList.toggle('off');
}

function updateExecuteBtn() {
    const btn = document.getElementById('execute-btn');
    btn.disabled = !state.currentScenario;
}

// =============================================
// EXECUTE SCENARIOS
// =============================================
async function executeScenario() {
    if (!state.currentScenario) return;

    const btn = document.getElementById('execute-btn');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Enviando...';

    try {
        switch (state.currentScenario) {
            case 'v1': await runV1(); break;
            case 'v2': await runV2(); break;
            case 'v3': await runV3(); break;
            case 'v4': await runV4(); break;
            case 'v5': await runV5(); break;
        }
    } catch(e) {
        appendMessage('error', '❌', `Error inesperado: ${e.message}`);
    } finally {
        btn.disabled = !state.currentScenario;
        btn.innerHTML = '▶ Ejecutar Petición';
    }
}

// --- V1: Endpoint público sin seguridad ---
async function runV1() {
    const url = `${API_BASE}/products?per_page=3`;
    const headers = { 'Accept': 'application/json' };
    const missing = [];
    const note = 'Endpoint público — no requiere token ni API Key. Muestra los primeros 3 productos del catálogo.';

    const res = await fetch(url, { headers });
    const data = await res.json();
    const limited = { ...data, data: data.data ? data.data.slice(0, 2) : data };

    appendToConsole(renderEntry(
        SCENARIOS.v1.label, SCENARIOS.v1.color,
        'GET', url, headers, missing, res.status, limited, note
    ));
}

// --- V2: API Key ---
async function runV2() {
    const url = `${API_BASE}/security/status`;
    const apiKeyOn = document.getElementById('apikey-toggle')?.classList.contains('on') ?? true;

    const headers = { 'Accept': 'application/json' };
    const missing = [];

    if (!state.token) {
        headers['Authorization'] = '(ausente)';
        missing.push('Authorization');
    } else {
        headers['Authorization'] = `Bearer ${state.token.substring(0, 30)}...`;
    }

    if (apiKeyOn) {
        headers['X-API-KEY'] = API_KEY;
    } else {
        missing.push('X-API-KEY');
    }

    const realHeaders = { 'Accept': 'application/json' };
    if (state.token) realHeaders['Authorization'] = `Bearer ${state.token}`;
    if (apiKeyOn) realHeaders['X-API-KEY'] = API_KEY;

    const note = apiKeyOn
        ? 'X-API-KEY enviado. Si también tienes sesión activa, recibirás 200 OK.'
        : 'X-API-KEY omitido intencionalmente para demostrar el rechazo del middleware.';

    const res  = await fetch(url, { headers: realHeaders });
    const data = await res.json();

    appendToConsole(renderEntry(
        SCENARIOS.v2.label, SCENARIOS.v2.color,
        'GET', url, headers, missing, res.status, data, note
    ));
}

// --- V3: Sanctum JWT ---
async function runV3() {
    const url = `${API_BASE}/security/status`;
    const headers = { 'Accept': 'application/json' };
    const missing = [];

    if (!state.token) {
        missing.push('Authorization');
        headers['Authorization'] = '(ausente — inicia sesión primero)';
    } else {
        headers['Authorization'] = `Bearer ${state.token.substring(0, 30)}...`;
    }
    headers['X-API-KEY'] = API_KEY;

    const realHeaders = { 'Accept': 'application/json', 'X-API-KEY': API_KEY };
    if (state.token) realHeaders['Authorization'] = `Bearer ${state.token}`;

    const note = state.token
        ? 'Bearer Token de Sanctum + API Key enviados. Demuestra autenticación stateless equivalente a JWT.'
        : 'Inicia sesión para obtener un token Bearer de Sanctum.';

    const res  = await fetch(url, { headers: realHeaders });
    const data = await res.json();

    appendToConsole(renderEntry(
        SCENARIOS.v3.label, SCENARIOS.v3.color,
        'GET', url, headers, missing, res.status, data, note
    ));
}

// --- V4: BOLA/IDOR ---
async function runV4() {
    const orderId = document.getElementById('order-id-input')?.value ?? '1';
    const url = `${API_BASE}/orders/${orderId}`;
    const headers = { 'Accept': 'application/json' };
    const missing = [];

    if (!state.token) {
        missing.push('Authorization');
        headers['Authorization'] = '(ausente)';
    } else {
        headers['Authorization'] = `Bearer ${state.token.substring(0, 30)}...`;
    }

    const realHeaders = { 'Accept': 'application/json' };
    if (state.token) realHeaders['Authorization'] = `Bearer ${state.token}`;

    const note = `Prueba IDOR con orden #${orderId}. Si eres Administrador/Gerencia → 200. Si la orden no te pertenece → 403.`;

    const res  = await fetch(url, { headers: realHeaders });
    const data = await res.json();

    appendToConsole(renderEntry(
        SCENARIOS.v4.label, SCENARIOS.v4.color,
        'GET', url, headers, missing, res.status, data, note
    ));
}

// --- V5: Rate Limiter ---
async function runV5() {
    const url = `${API_BASE}/security/ping`;
    const realHeaders = { 'Accept': 'application/json', 'X-API-KEY': API_KEY };
    if (state.token) realHeaders['Authorization'] = `Bearer ${state.token}`;

    appendMessage('info', '🚦',
        `Enviando 4 peticiones rápidas a ${url}. La cuarta debe devolver <strong>429 Too Many Requests</strong>...`);

    const NUM_REQS = 4;
    for (let i = 1; i <= NUM_REQS; i++) {
        await new Promise(r => setTimeout(r, i === 1 ? 0 : 200));

        const headers = { 'Accept': 'application/json' };
        if (state.token) headers['Authorization'] = `Bearer ${state.token.substring(0, 30)}...`;
        headers['X-API-KEY'] = API_KEY;
        const missing = state.token ? [] : ['Authorization'];

        let res, data;
        try {
            const r = await fetch(url, { headers: realHeaders });
            res  = r.status;
            data = await r.json().catch(() => ({ message: 'No JSON body' }));
        } catch(e) {
            res  = 0;
            data = { error: e.message };
        }

        const scenarioLabel = `${SCENARIOS.v5.label} — Req ${i}/${NUM_REQS}`;
        appendToConsole(renderEntry(
            scenarioLabel, SCENARIOS.v5.color,
            'GET', url, headers, missing, res, data,
            i < NUM_REQS
                ? `Petición ${i}: dentro del límite (${i}/3 por minuto).`
                : `⚠️ Petición ${i}: superó el límite de 3 req/min → Rate Limiter activado.`
        ));
    }
}

// =============================================
// LOGIN with Enter key
// =============================================
['input-email','input-password'].forEach(id => {
    document.getElementById(id).addEventListener('keydown', e => {
        if (e.key === 'Enter') doLogin();
    });
});
</script>
</body>
</html>
