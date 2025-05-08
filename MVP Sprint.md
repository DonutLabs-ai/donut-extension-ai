# MVP Sprint

### **P0 Core Module Implementation Logic**

### **1. Infrastructure (Browser Extension)**

- **Steps.**
    1. **Project initialization:** Initialize the project using `pnpm` or `yarn`, configure Manifest V3 (declare Background Service Worker, Permissions such as `storage`, `activeTab`, `scripting`, `alarms`, `notifications`. `commands` API to define shortcuts).
    2. **Build tools:** Configure Vite or Webpack for packaging extensions (supports TS, Preact, TailwindCSS).
    3. **Core Components.**
        - **Background Worker:** Handles core logic, state management portal (Zustand Store initialization). Listening to `chrome.commands` and `chrome.runtime.onMessage`.
        - **Popup UI / Injected UI:** Command bar entry interface (using Preact, TailwindCSS, cmdk/kbar). Communicate with Background via `chrome.runtime.sendMessage`.
        - **Content Script (on-demand):** If you need to read page information or inject UI, configure `matches` rule, use `chrome.scripting.executeScript` to inject. 2.

### **2. User Authentication and Wallet Integration (Privy)**

- **Steps.**
    1. **SDK Integration:** Introduce `@privy-io/react-auth` (if UI is React/Preact) or `@privy-io/js-sdk-core` (if you need to operate directly in Background) in Background Worker or UI script.
    2. **Provider Configuration:** Configure `PrivyProvider` at the top level of the UI component (if using React SDK).
    3. **Login flow:** Implement logic that calls `privy.login()` to handle authentication state changes `(usePrivy` hook or SDK events).
    4. **State Synchronization:** Synchronize authentication state, user ID, and list of associated wallets to Zustand global state and `chrome.storage.session/local`.
    5. **Provider fetching:** Provide function for subsequent chain interaction module to fetch EIP-1193 Provider of currently active wallet.

### **3. Command Bar Core Functions**

- **Steps.**
    1. **UI Implementation:** Use `cmdk` or `kbar` to build the command input and suggestion list display interface.
    2. **Input Processing:** Listen to user input and send it to Background Worker in real time.
    3. **Command parsing (Background):** Implement a parser based on regular expressions or simple splitting to extract commands and parameters.
    4. **Basic Autocompletion (Background).**
        - Load preset command templates and user history commands `(chrome.storage.local` ).
        - Use `Fuse.js` to fuzzy match user input to generate a list of suggestions.
        - Send the list of suggestions back to the UI for display.
    5. **Command Execution Routing (Background):** Calls the corresponding handler function (information query, transaction preparation, setting change, etc.) based on the parsed command name.
    6. **Result Display (UI):** Receive the execution result or status update returned by Background Worker and display it in UI (text message, chart, transaction status link, etc.). 4.

### **4. Information query command implementation (e.g. `price`, `chart`, `rug check`)**

- **Steps (Background Worker).**
    1. **API Client Wrapper:** Write a simple request function or wrapper class for third party APIs (CoinGecko, GoPlus, DexScreener, etc.) that need to be called, and manage the API Key (for security reasons, it is recommended to move to the back-end in P1).
    2. **Data Fetching:** Call the corresponding API Client to fetch data according to the command parameters.
    3. **Caching strategy:** Implement simple in-memory or `chrome.storage.local` caching to minimize repetitive API calls.
    4. **Data Processing and Formatting:** Process the data returned by the API, extract key information, and format it into a structure suitable for UI display.
    5. **Chart Data Processing (`chart`):** Get the K-line data and format it into the format required by TradingView Lightweight Charts.
    6. **Send result:** send the processed data to the UI. 5.

### **5. Trade execution command implementation (e.g. `swap`, `send`)**

- **Step (Background Worker).**
    1. **Get Signer/Provider:** Get the current user's Provider from the Wallet Integration Module and get the Signer using ethers.js/web3.js.
    2. **Get Trade Parameters (`swap`):** Call the DEX aggregator API (e.g. Jupiter V6 SDK/API for Solana) to get quotes and trade data (Route Plan).
    3. **Build the transaction:** Build the transaction object using ethers.js/web3.js and the data returned by the aggregator. For `send`, build a standard token transfer transaction.
    4. **Initiate transaction:** Call `signer.sendTransaction(tx)` or `connection.sendTransaction(tx, [signer]).` Privy SDK handles the signature confirmation process automatically.
    5. **(P1) Transaction Monitoring:** After sending a transaction, fetch the transaction hash and periodically poll the RPC node to check the status of the transaction using the `chrome.alarms` API, or subscribe using WebSocket (if RPC is supported).
    6. **Status update:** Send transaction status (Pending, Success, Fail) and block browser link to UI. 6.

### **6. AI auto-completion (P0 base + P0.5 backend)**

- **P0 (Local Fuzzy Matching):** described in Command Bar core functionality.
- **P0.5 (backend enhancement).**
    1. **Backend Interface:** define AI Complement API interface to receive context (input text, history, page info? , wallet information?) Backend implementation: use LangChange to implement the AI Complement API.
    2. **Backend implementation:** Use LangChain/LlamaIndex in combination with LLM (OpenAI/Claude) and knowledge of predefined commands, user history, to generate smarter complementary suggestions.
    3. **Background calls:** In addition to local fuzzy matching, (optionally) call the back-end AI complementation interface when the user inputs.
    4. **Result Merge:** Merge local and back-end returned suggestions, de-rank them and send them to the UI.

### **7. Text Selection Enhancement (P0 BASIC)**

- **Steps.**
    1. **Content Script:** Listen to `mouseup` event, get text from `window.getSelection()`.
    2. **Entity Recognition (local):** Content Script or Background Worker uses regular expressions to match against a locally maintained list of Token symbols/terms.
    3. **Trigger UI:** Notify Background Worker if entity is recognized, Background Worker gets relevant data (price, etc.).
    4. **Floating Panel UI:** Using `shadow-selection` or similar technology, display a small floating panel (Shadow DOM isolation style) near the selected text, showing information about the fetched entity (price, Buy button - actually calls Command Bar swap).
    5. **Context menu:** Add "Analyze Crypto Content" menu item using `chrome.contextMenus` API, which performs similar logic when clicked. 8.

### **8. Clippy AI Assistant (P0 Basic)**

- **P0 Scope:** Build a basic framework to suggest and coordinate the execution of relevant commands based on simple rules and context-awareness.
- **Steps (mainly implemented in Background Worker, UI with display).**
    1. **Rule engine:** implement rule matching based on user behavior (page access, text selection, command history) and simple context to trigger suggestions.
    2. **Context management:** collects necessary contextual information (current page URL/Title, selected entities, recent commands).
    3. **Suggestion generation (simple planning).**
        - **Rule Mapping:** Maps matching rules directly to pre-defined Command Bar command suggestions.
        - **LLM Assist (optional):** (P0.5) Call LLM API to generate 1-2 most relevant command suggestions based on context.
    4. **Task Coordination (simple):** Calls the internal Command Bar Command Execution module when the user accepts a suggestion.
    5. **Status Feedback:** Feedback the execution status (Pending, Success, Error) to the user via the Clippy UI.
    6. **Short-term memory:** Record Clippy's suggestions and user interactions for the session to avoid repetitive or out-of-place suggestions.

---

# **Donut P0 Feature Development Schedule**

- **P0 Scope Core Goals.**
    - **Phase 1 (Command Bar):** Users can use core P0 level message lookup and transaction execution commands (e.g., `swap`, `send`, `price`, `chart`, `rug check`, etc.) via the Command Bar, integrated with Privy for authentication and basic wallet operations, with basic local command completion.
    - **Phase 2 (Text Selection Enhancements):** Users will be able to select cryptographic terms on the web page to trigger message panels showing basic information.
    - **Phase 3 (Clippy AI Assistant):** Building on Phases 1 & 2, a basic version of the Clippy assistant is introduced. It can suggest a small number of relevant actions based on simple rules and context (reusing commands from the Command Bar), coordinate the execution of these simple tasks, and provide basic task status feedback. The focus is on building the basic framework, not complex AI learning.
- **Team Roles:** Front-end engineers, back-end/algorithm engineers.

---

**Phase 1: Command Bar (4 weeks)**

- **Goal:** Complete P0 level Command Bar functionality (infra, auth, UI, parsing, core query/transaction commands) to be internally testable.
- **Sprint 1 (Week 1): Infrastructure & Swap Command**
    - **Goal:** Set up basic FE/BE infrastructure, integrate Privy auth, and implement core `swap` command functionality.
    - **Front-end (3-5 days):** Initialize project, configure Manifest V3/build tools; implement basic Command Bar input UI; basic Background Worker <-> UI communication; Integrate PrivyProvider & login flow; Implement UI flow for initiating `swap` command and handling Privy signing/status display.
    - **Backend/Algorithm (3-5 days):** Basic Background Worker setup; integrate Privy SDK for auth state & getting provider/signer; Integrate DEX aggregator API (e.g., Jupiter) for `swap` quotes/routes; Build `swap` transaction object (ethers.js/web3.js); Handle basic `sendTransaction` call via Privy. (Optional: Basic backend API setup if aggregator logic is moved there).
- **Sprint 2 (Week 2): Command Bar UI Refinement & Wallet Connections**
    - **Goal:** Refine Command Bar UI (suggestions), display wallet info, and start command parsing.
    - **Frontend (3-5 days):** Implement suggestion list display in Command Bar UI (using cmdk/kbar); connect to Zustand; display connected wallets (from Privy).
    - Background **(2-4 days):** Implement logic in Background Worker to get Privy user wallets; sync wallet info to state/Storage; Start implementing basic command parser (regex/split).
- **Sprint 3 (Week 3): Command Parsing & Core Query Commands**
    - **Goal:** Finalize command parsing, implement local fuzzy completion, and implement core query commands (`price`, `chart`).
    - **Frontend (2-4 days):** Pass input to Background Worker; receive/display suggestions accurately; Display query results (text, TradingView).
    - Background **(3-5 days):** Finalize command parser; load preset/history commands; Use Fuse.js for fuzzy completion; Wrap CoinGecko/DexScreener clients; implement `price`/`chart` fetch/process/cache logic.
- **Sprint 4 (Week 4): Send Command & Phase 1 Testing/Docs**
    - **Objective:** Implement `send` command, integrate Phase 1 features, conduct internal testing, and prepare documentation.
    - **Frontend (1-3 days):** Design pre-confirmation UI for `send`; ensure smooth flow for all commands.
    - Background **(2-4 days):** Build `send` transaction object (ethers.js/web3.js); Initiate Privy signing for `send`; End-to-end testing, error handling, code optimization.
    - **Team (1-2 days):** Internal cross-testing, collecting feedback.

---

**Phase 2: Text Selection Enhancement (4 weeks)**

- **Goal:** Complete P0 level Text Selection enhancement functionality and integrate remaining P0 commands.
- **Sprint 5 (Week 5): Text Selection Basic Implementation**
    - **Goal:** Implement basic text selection trigger and floating panel UI.
    - **Front End (3-5 days):** Implement Content Script to listen for text selections; Implement basic floating information panel UI (Shadow DOM).
    - **Backend/Algorithms (Days 2-4):** Implement text selection-enhanced local entity recognition (Regex/Dictionary) and basic data (price) fetching logic; Call Background from Content Script to get entity info.
- **Sprint 6 (Week 6): More Information Query Commands**
    - **Objective:** To implement more information query commands such as `rug check`, `liquidity`, etc.
    - **Frontend (1-2 days):** Design and implement result display UI for new commands.
    - **Backend/Algorithm (3-5 days):** Interface with GoPlus Security, chain data APIs (e.g., Alchemy/QuickNode); implement data fetching and processing logic for related commands.
- **Sprint 7 (Week 7): Refinement and Integration (Text Selection)**
    - **Goal:** Refine Text Selection UI/UX, handle edge cases, integrate data display.
    - **Front End (2-4 days):** Improve floating panel display logic, add context menu trigger, display fetched data (price, etc.).
    - **Backend/Algorithms (2-4 days):** Refine entity recognition, improve data fetching reliability, handle API errors gracefully.
- **Sprint 8 (Week 8): Phase 1 & 2 Integration, Testing, Docs**
    - **Goal:** Integrate Command Bar and Text Selection features, perform internal testing, and prepare documentation for both phases.
    - **Front-end (2-4 days):** End-to-end testing, fix UI bugs across both features, component refinement.
    - **Backend/Algorithm (2-4 days):** End-to-end testing, API error handling, code optimization, prepare internal technical documentation.
    - **Team (1-2 days):** Internal cross-testing, collecting feedback on combined features.

---

**Testing Milestone 1: Command Bar**

- **Internal testing:** Start early Week 5 (based on Sprint 4 results).
- **Alpha Testing (small group):** Weeks 6-7.

**Testing Milestone 2: Text Selection Enhancement & Combined P0 (Phase 1+2)**

- **Internal testing:** Start early Week 9 (based on Sprint 8 results).
- **Alpha Testing (small group):** Weeks 10-11.
- **Beta testing (larger scale):** Weeks 12-13.

---

**Phase 3: Clippy AI Assistant (12 weeks)**

- **Goal:** Based on Phases 1 & 2, develop and integrate a P0-level Clippy AI assistant framework capable of basic context awareness, task suggestion, and execution coordination.
- **Sprint 9 (Week 14): Clippy Infrastructure and Intent Recognition**
    - **Goal:** Build the basic framework of the Clippy module and implement simple rule-based intent filtering.
    - **Frontend (2-4 days):** Design/implement basic Clippy UI (sidebar prompts, simple dialog).
    - **Backend/Algorithm (3-5 days):** Design Clippy state machine; implement basic rule engine (e.g., if user visits trading site AND selects token -> suggest 'price'/'chart'); integrate Background Worker to listen to user behavior events.
- **Sprint 10 (Week 15): Context Gathering and Planning Module (Basic)**
    - **Goal:** Gather basic context information and use LLM for simple task planning.
    - **Frontend (1-3 days):** Send context info (URL, selected text) from UI/Content Script to Background Worker.
    - **Backend/Algorithms (3-5 days):** Implement context collection logic; encapsulate LLM API calls; design simple prompts for LLM to generate relevant command suggestions (reusing Command Bar commands).
- **Sprint 11 (Week 16): Memory Module (Basic)**
    - **Goal:** Implement basic short-term memory functionality.
    - **Front End (1-2 days):** Demonstrate current context/task state understood by Clippy.
    - **Backend/Algorithm (3-5 days):** Use `chrome.storage.session`/Background Worker memory for session context, suggestion history, user feedback.
- **Sprint 12 (Week 17): Tools Usage (Basic)**
    - **Goal:** Enable Clippy to invoke Command Bar execution capabilities.
    - **Front End (Days 1-3):** Implement logic to trigger a command from Clippy suggestion click.
    - **Backend/Algorithms (3-5 days):** Design/implement interface for Clippy to call internal command execution module; pass parameters.
- **Sprint 13 (Week 18): Execution Flow and State Visualization (Basic)**
    - **Goal:** Implement basic Clippy task coordination flow and status feedback.
    - **Front-end (3-5 days):** Visualize execution step, state (Pending, Success, Fail), and result in Clippy UI.
    - **Backend/Algorithm (2-4 days):** Implement basic flow control (sequential execution); pass status updates from command execution to Clippy module/frontend UI.
- **Sprint 14-17 (weeks 19-22): Iteration and Extension**
    - **Goal:** Iteratively optimize Clippy based on internal feedback; add support for 1-2 new scenarios or simple multistep tasks.
    - **Front-end (5-8 days):** Adjust UI for new scenarios; optimize interaction flow.
    - **Backend/Algorithms (8-12 days):** Optimize rules/LLM Prompt; support simple task sequences; handle basic errors.
- **Sprint 18-20 (Weeks 23-25): Overall Integration, Testing, and Documentation**
    - **Goal:** Deeply integrate Clippy with Phase 1&2 functionality, perform complete P0 internal testing, prepare documentation.
    - **Front-end (4-6 days):** Full tuning of Clippy interactions; unified state management; bug fixes.
    - **Backend/Algorithm (5-8 days):** Optimize overall performance; improve error handling; ensure smooth data flow; prepare tech docs.
    - **Team (3-5 days):** Conduct internal cross-testing and scenario testing of full P0 functionality.

---

**Testing Milestone 3: Full P0 System (including Clippy)**

- **Internal Testing:** Launch early Week 26 (based on Sprint 20 results).
- **Alpha testing (small scale):** Weeks 27-28.
- **Beta testing (more extensive):** Weeks 29-30 and beyond.

---

# **Critical Test Nodes**

1. **Command Bar Test Plan (Phase 1)**
    - Internal Test Initiation: Week 5 (end of Sprint 4)
    - Alpha Test Launch: Week 6 (with fix cycle)
2. **Text Selection & Combined P0 Test Plan (Phase 1+2)**
    - Internal Test Initiation: Week 9 (end of Sprint 8)
    - Alpha Test Launch: Week 10 (with fix cycle)
    - Beta Test Launch: Week 12 (in parallel with Clippy development)
3. **Full System Test Plan (Phase 1+2+3)**
    - Internal Full Test: Week 26 (end of Sprint 20)
    - Public Alpha Test: Week 27 (2-week fix period)
    - Public Beta Test: Week 29 (4-week testing period)

## **Risk Control**

1. **Technical Risk Assessment**

|  Risk |  Likelihood |  Impact |  Mitigation |
| --- | --- | --- | --- |
|  Chrome extension performance issues |  Medium |  High |  Use Preact to reduce package size, use Web Workers to handle complex calculations |
|  AI model latency is too high |  High |  High |  Implement local caching system, preprocess common tasks, train small models for entity recognition and intent recognition tasks |
|  Page compatibility issues |  High |  Medium |  Use Shadow DOM to isolate styles, use shadow-selection for secure injection |
|  User data security |  Medium |  High |  End-to-end encryption, local execution of sensitive operations |
|  Complex MCP server integration |  Medium |  Medium |  Phased implementation, first build the basic command system, then expand the local MCP services |