# Unit of Work — Requirements Map

Since User Stories were skipped, this maps functional requirements (from requirements.md) to units.

| Requirement | Unit(s) |
|---|---|
| FR-01: Core Sokoban Gameplay | Unit 1 (Board, InputHandler, StateManager) |
| FR-02: Level System (XSB Format) | Unit 1 (LevelParser) + Unit 2 (LevelManager, .sok files) |
| FR-03: Star Rating System | Unit 2 (LevelManager — hardcoded optimal values) |
| FR-04: Level Progression | Unit 2 (LevelManager — unlock logic, persistence) |
| FR-05: Game Screens | Unit 5 (all scenes + UI components) |
| FR-06: Camera Controls | Unit 3 (IsometricCamera) + Unit 1 (InputHandler) |
| FR-07: Input Mapping | Unit 1 (InputHandler) + Unit 5 (GameScene wiring) |
| FR-08: State Persistence | Unit 1 (StateManager) |
| NFR-01: Rendering | Unit 3 (all rendering components) |
| NFR-02: Audio | Unit 4 (AudioManager, MusicEngine, SFXEngine) |
| NFR-03: Performance | Unit 3 (rAF loop) + Unit 5 (GameScene game loop) |
| NFR-04: Technology Constraints | All units (ES modules, no build tools, CDN Three.js) |
| NFR-05: Player Character | Unit 3 (PlayerRenderer) |
