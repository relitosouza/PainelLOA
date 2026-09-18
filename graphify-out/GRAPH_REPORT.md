# Graph Report - PainelLOA  (2026-09-15)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 3978 nodes · 8629 edges · 214 communities (191 shown, 23 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 127 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9e58d6bd`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- live-browser.js
- checks.mjs
- index.mjs
- setLiveState
- context.mjs
- resumeSession
- @prisma/client
- modern-screenshot.umd.js
- analytic-dashboard-layout.tsx
- hook-lib.mjs
- manual-apply.mjs
- design-system.mjs
- live-commit-manual-edits.mjs
- analise-loa-view.tsx
- el
- impeccable-config.mjs
- live-server.mjs
- svelte-component.mjs
- Result
- detect-html.mjs
- format.ts
- presentation-dashboard.tsx
- Product
- live-inject.mjs
- detect-antipatterns-browser.js
- initGlobalBar
- insert-ui.mjs
- hook-admin.mjs
- live-wrap.mjs
- db.ts
- CancellationToken
- hook-before-edit.mjs
- design-parser.mjs
- css-cascade.mjs
- session-store.mjs
- check_staleness.py
- detect-antipatterns.mjs
- live-accept.mjs
- initPageChat
- claude_digest.py
- live-copy-edit-agent.mjs
- app-shell.tsx
- parseRgb
- loa/route.ts
- consultaReceitas.ts
- detectHtml
- runHook
- live-poll.mjs
- rest-api-template.py
- inspect.py
- PromptOptimizer
- parser.ts
- $value
- detect-url.mjs
- handleManualEditActivity
- manual-edit-routes.mjs
- live-manual-edit-evidence.mjs
- BaseSpecification
- ldo-receita-view.tsx
- parseRgb
- package.json
- react
- impeccable-paths.mjs
- PerformanceChecker
- parseAnyColor
- captureElementToBlob
- importacaoReceitas.ts
- dashboard-data.ts
- typography
- data-table.tsx
- geo_checker.py
- validate_handoff.py
- compilerOptions
- live.mjs
- resolveLengthPx
- MemeGenerator
- xlsx
- auth.ts
- onAnnotDown
- createLiveBrowserSessionState
- auxiliary-tables-parser.ts
- analise-loa-advanced-filters.tsx
- banco-projetos-card.tsx
- checklist.py
- scripts
- enquadramento-rules.ts
- verify_all.py
- fontSize
- sampleCssBackground
- createLiveBrowserDomHelpers
- list_handoffs.py
- context-signals.mjs
- setup_test_env.py
- run_full_scan
- auditoria-orcamentaria-modal.tsx
- component-template.tsx
- borderRadius
- fontWeight
- default
- feedback
- mono
- critique-storage.mjs
- scheduleLazyVisualContrast
- collectBrowserFindings
- resolveLiveInjectionAnchor
- convert_rules.py
- devDependencies
- enquadramentos/route.ts
- UnitOfWork
- i18n_checker.py
- gerar_exportacao_modificados.cjs
- detect-csp.mjs
- palette.mjs
- pin.mjs
- update_plugin_version
- session_manager.py
- api_validator.py
- design-tokens-template.json
- brand
- normalizeIgnoreValueEntries
- syncEditBadgeHitProxies
- ui-core.mjs
- dependencies
- agent/route.ts
- auto_preview.py
- blue
- text
- PagedResult
- postSerializedFindings
- unpack.py
- layout.tsx
- schema_validator.py
- red
- green
- gray
- semantic
- accessibility_checker.py
- UXAuditor
- isScreenReaderOnlyTextStyle
- renderTemplate
- lint_runner.py
- type_coverage.py
- MobileAuditor
- test_runner.py
- ldo-parser.ts
- $type
- $type
- $type
- $type
- $type
- $type
- $type
- $type
- analises-combinadas.tsx
- primary
- secondary
- $value
- $value
- normal
- ProductServiceOptions
- find_aws_icon.py
- lighthouse_audit.py
- create_plugin_structure
- playwright_runner.py
- clean_ldo_actions_exact.ts
- final_perfect_ldo_loa_sync.ts
- fix_ldo_db_clean.ts
- guarantee_100_percent_match.ts
- normalize_all_actions_in_db.ts
- seed_usuarios.ts
- budget-calculation-service.ts
- validate-chart.sh
- checkElementHeroEyebrow
- isGeneratedFile
- sync_db_to_reference_image.ts
- spacing
- 10
- 12
- 16
- 1
- 20
- 24
- 2
- 3
- 4
- 5
- 6
- 8
- error
- detect.mjs
- eslint.config.mjs
- @playwright/test
- importar/page.tsx
- restore/route.ts
- create_bug_report.sh
- generate_test_cases.sh
- backup/route.ts
- arrecadada/confirmar-importacao/route.ts
- inspecionar-exportacao.cjs
- check-tool.sh
- run-taze.sh
- convert-drawio-to-png.sh
- convert.sh
- thermal-sample.sh
- preflight.sh
- next-env.d.ts
- postcss.config.mjs
- backup-db.sh
- pre-flight-release.sh
- restore-db.sh
- verificar-colunas-financeiras.cjs

## God Nodes (most connected - your core abstractions)
1. `react` - 55 edges
2. `Product` - 37 edges
3. `@prisma/client` - 33 edges
4. `runHook()` - 30 edges
5. `initGlobalBar()` - 29 edges
6. `setLiveState()` - 29 edges
7. `detectHtml()` - 28 edges
8. `el()` - 27 edges
9. `collectBrowserFindings()` - 26 edges
10. `buildInsertConfigureRow()` - 26 edges

## Surprising Connections (you probably didn't know these)
- `main()` --calls--> `parseWorkbook()`  [EXTRACTED]
  importar_planilha.ts → src/lib/parser.ts
- `enableInlineEdit()` --indirect_call--> `own()`  [INFERRED]
  .agents/skills/impeccable/scripts/live-browser.js → .agents/skills/impeccable/scripts/live-browser-dom.js
- `layoutFlowChildren()` --indirect_call--> `pickable()`  [INFERRED]
  .agents/skills/impeccable/scripts/live-browser.js → .agents/skills/impeccable/scripts/live-browser-dom.js
- `detectHtml()` --calls--> `checkCreamPalette()`  [EXTRACTED]
  .agents/skills/impeccable/scripts/detector/engines/static-html/detect-html.mjs → .agents/skills/impeccable/scripts/detector/rules/checks.mjs
- `detectHtml()` --calls--> `checkPageLayout()`  [EXTRACTED]
  .agents/skills/impeccable/scripts/detector/engines/static-html/detect-html.mjs → .agents/skills/impeccable/scripts/detector/rules/checks.mjs

## Import Cycles
- None detected.

## Communities (214 total, 23 thin omitted)

### Community 0 - "live-browser.js"
Cohesion: 0.03
Nodes (143): acceptedDomAlreadyClean(), addManualContextText(), applyGlobalBarLabelState(), applyPlaceholderSizingStyles(), applySvelteComponentVariantStyle(), bufferToBase64(), buildCollapsible(), buildColorModels() (+135 more)

### Community 1 - "checks.mjs"
Cohesion: 0.05
Nodes (84): borderColorsFromStyle(), borderWidthsFromStyle(), checkClippedOverflow(), checkCreamPalette(), checkElementClippedOverflow(), checkElementClippedOverflowDOM(), checkElementGptBorderShadow(), checkElementGptBorderShadowDOM() (+76 more)

### Community 2 - "index.mjs"
Cohesion: 0.06
Nodes (68): addBrowserFindings(), addVisualContrastFindings(), addVisualContrastResult(), analyzeVisualContrast(), analyzeVisualContrastCandidate(), blendRgba(), browserColorsClose(), browserDesignSystemConfig() (+60 more)

### Community 3 - "setLiveState"
Cohesion: 0.08
Nodes (69): abortSvelteComponentInjection(), applyEditing(), buildInsertPlaceholderSnapshotFromDom(), buildLocatorForLeaf(), buildPickedAnchorSnapshot(), cancelEditing(), cancelEditingToPicking(), cancelInsertConfigure() (+61 more)

### Community 4 - "context.mjs"
Cohesion: 0.07
Nodes (66): buildMissingTargetDirective(), buildResolvedContextDirective(), buildTargetSelectionDirective(), buildUpdateDirective(), cli(), compareSemver(), computeUpdateDirective(), contextSourcePath() (+58 more)

### Community 5 - "resumeSession"
Cohesion: 0.07
Nodes (66): applyOriginalAttrsToSvelteAnchor(), applyParamDefaults(), applyParamValue(), applyPlaceholderDimensions(), applySavedSessionMeta(), buildParamsPanel(), clampVariantIndex(), closedClipPath() (+58 more)

### Community 6 - "@prisma/client"
Cohesion: 0.04
Nodes (36): extractCode(), main(), matches(), prisma, refTable, prisma, refTable, prisma (+28 more)

### Community 7 - "modern-screenshot.umd.js"
Cohesion: 0.09
Nodes (55): ae(), be(), bt(), Ce(), s(), Ct(), de(), dt() (+47 more)

### Community 8 - "analytic-dashboard-layout.tsx"
Cohesion: 0.07
Nodes (41): TransparentePage(), AnalyticDashboardLayout(), findCodeGroupValue(), findGroup(), findGroupValue(), formatCompactMoney(), normalizeText(), BarChart() (+33 more)

### Community 9 - "hook-lib.mjs"
Cohesion: 0.06
Nodes (51): ACK_EXTS, ALLOWED_EXTS, applyConfigSource(), applyDetectorConfigSource(), applyPatchText(), clampByte(), cloneDefaultConfig(), CO_SCAN_STYLE_NAMES (+43 more)

### Community 10 - "manual-apply.mjs"
Cohesion: 0.09
Nodes (49): addOpToManualApplyChunk(), APPLY_EVENT_HARD_TIMEOUT_MS, APPLY_EVENT_SOFT_DEADLINE_MS, buildManualApplyAgentAction(), clearManualApplyTransaction(), collectManualApplyFiles(), compactManualApplyBatch(), compactManualApplyCandidates() (+41 more)

### Community 11 - "design-system.mjs"
Cohesion: 0.09
Nodes (49): addColorObject(), addDesignColor(), addRoundedScale(), addRoundedToken(), addSidecarColors(), addSidecarRadii(), addTypographyFonts(), canonicalDesignFindingKey() (+41 more)

### Community 12 - "live-commit-manual-edits.mjs"
Cohesion: 0.10
Nodes (49): allEntryIds(), argVal(), buildRepairBatch(), candidatesForEntry(), changedFilesSinceSnapshot(), clearAppliedEntries(), collectApplyOwnedFiles(), collectRollbackFiles() (+41 more)

### Community 13 - "analise-loa-view.tsx"
Cohesion: 0.06
Nodes (43): AddElementExpenseDialog(), ExpenseElementOption, formatVinculoComAplicacao(), Props, VINCULO_OPTIONS, AnaliseLoaDespesaKpis, AnaliseLoaKpisProps, AnaliseLoaReceitaKpis (+35 more)

### Community 14 - "el"
Cohesion: 0.08
Nodes (49): actionLabel(), applyConfigureBarChrome(), bindConfigureCountPillTooltip(), bindConfigureInlineControlHover(), bindConfigureModifierPillHover(), buildConfigureActionControl(), buildConfigureCountControl(), buildConfigureRow() (+41 more)

### Community 15 - "impeccable-config.mjs"
Cohesion: 0.10
Nodes (47): applyDetectionConfigSource(), clampByte(), cleanIgnoreValueDisplay(), cloneDetectionConfig(), cloneRawDetectionConfig(), colorIgnoreKey(), DEFAULT_DETECTION_CONFIG, DETECTOR_CONFIG_KEYS (+39 more)

### Community 16 - "live-server.mjs"
Cohesion: 0.09
Nodes (45): assembleLiveBrowserScript(), assertLiveBrowserScriptParts(), LIVE_BROWSER_SCRIPT_PARTS, readLiveBrowserScriptParts(), resolveLiveBrowserScriptParts(), acknowledgePendingEvent(), activeSessionSummaries(), agentPollingConnected() (+37 more)

### Community 17 - "svelte-component.mjs"
Cohesion: 0.09
Nodes (47): applyLegacyDeferredAcceptsOnStartup(), appendCssToSvelteStyle(), appendSanitizedCssRule(), applyDeferredSvelteComponentAccepts(), bakeParamValuesInCss(), buildInsertVariantStub(), buildPropContract(), buildPropsScript() (+39 more)

### Community 18 - "Result"
Cohesion: 0.10
Nodes (29): AbstractValidator, CancellationToken, DateTime, Func, ILogger, Task, CreateProductRequest, CreateProductRequestValidator (+21 more)

### Community 19 - "detect-html.mjs"
Cohesion: 0.07
Nodes (33): CSS_IN_JS_EXTENSIONS, extFromFilePath(), isNeutralBorderColor(), PAGE_ANALYZER_EXTS, REGEX_ANALYZERS, REGEX_MATCHERS, runTextContentAnalyzers(), shouldRunPageAnalyzers() (+25 more)

### Community 20 - "format.ts"
Cohesion: 0.06
Nodes (28): AuxiliaryCode, ElaboracaoLoaView(), ExpenseWithoutSubelement, LdoAction, LinkItem, STATUS_CLASS, STATUS_LABEL, Suggestion (+20 more)

### Community 21 - "presentation-dashboard.tsx"
Cohesion: 0.08
Nodes (36): BudgetScenarioSimulator(), compactCurrency(), compactCurrency(), ExecutiveActionKpis(), ExecutiveAlertsMap(), compactCurrency(), InsufficientLdoGoalsCard(), LdoDeliveryMatrix() (+28 more)

### Community 22 - "Product"
Cohesion: 0.06
Nodes (43): DateTime, AppDbContext, Categories, OrderItems, Orders, Products, Category, Id (+35 more)

### Community 23 - "live-inject.mjs"
Cohesion: 0.09
Nodes (43): appendOriginToDirective(), buildTagBlock(), commentClose(), commentOpen(), CONFIG_PATH, detectLineEnding(), __dirname, ensureLiveGitIgnores() (+35 more)

### Community 24 - "detect-antipatterns-browser.js"
Cohesion: 0.08
Nodes (37): checkBorders(), checkClippedOverflow(), checkElementBorders(), checkElementBordersDOM(), checkElementClippedOverflow(), checkElementClippedOverflowDOM(), checkElementItalicSerif(), checkElementItalicSerifDOM() (+29 more)

### Community 25 - "initGlobalBar"
Cohesion: 0.09
Nodes (41): attachSteerFocusDebug(), attachSteerFocusGuard(), barPaletteForTheme(), brandMarkSvg(), buildSteerProcessingDots(), clearSteerFocusRecoverTimer(), detectPageTheme(), ensureAgentPollTooltip() (+33 more)

### Community 26 - "insert-ui.mjs"
Cohesion: 0.07
Nodes (25): FORBIDDEN_MANUAL_EDIT_TEXT_CHARS, INSERT_POSITIONS, isValidId(), isValidVariantId(), validateAnnotationFields(), validateEvent(), validateInsertGenerate(), validateManualEditEvent() (+17 more)

### Community 27 - "hook-admin.mjs"
Cohesion: 0.14
Nodes (39): ACTIONS, addIgnoreFile(), addIgnoreRule(), addIgnoreValue(), DETECTOR_CONFIG_KEYS, detectorSection(), fileHasImpeccableHookMarker(), HOOK_MANIFEST_TARGETS (+31 more)

### Community 28 - "live-wrap.mjs"
Cohesion: 0.13
Nodes (35): argVal(), buildInsertWrapperLines(), computeInsertLine(), INSERT_POSITIONS, insertCli(), isInsertPosition(), resolveElementMatch(), buildSvelteComponentCssAuthoring() (+27 more)

### Community 29 - "db.ts"
Cohesion: 0.07
Nodes (8): zod, restaurarExclusaoSchema, alteracaoOrcamentariaSchema, loteAlteracoesSchema, usuarioUpdateSchema, usuarioCreateSchema, db, globalForPrisma

### Community 30 - "CancellationToken"
Cohesion: 0.15
Nodes (12): CancellationToken, ILogger, IReadOnlyList, ProductSearchRequest, Task, DapperProductRepository, EfCoreProductRepository, IProductRepository (+4 more)

### Community 31 - "hook-before-edit.mjs"
Cohesion: 0.12
Nodes (35): allow(), bumpCursorDenial(), deny(), done(), escapeRegExp(), findingSignature(), firstMatch(), firstString() (+27 more)

### Community 32 - "design-parser.mjs"
Cohesion: 0.15
Nodes (33): buildColor(), CANONICAL_SECTIONS, collectBullets(), collectColorValues(), collectParagraphs(), detectFormat(), extractColors(), extractComponents() (+25 more)

### Community 33 - "css-cascade.mjs"
Cohesion: 0.11
Nodes (31): applyStaticDeclaration(), buildBorderOverrideMap(), parseShorthand(), resolveVar(), buildStaticStyleMap(), collectStaticCssRules(), compareStaticPriority(), cssPropToCamel() (+23 more)

### Community 34 - "session-store.mjs"
Cohesion: 0.12
Nodes (28): isLiveServerPidReachable(), readLiveServerInfo(), completeCli(), completeThroughServer(), parseArgs(), readServerInfo(), collectManualApplyFiles(), manualApplyReplyCommand() (+20 more)

### Community 35 - "check_staleness.py"
Cohesion: 0.09
Nodes (32): calculate_staleness_level(), check_files_exist(), check_staleness(), get_changed_files_since(), get_commits_since(), get_current_branch(), main(), parse_handoff_metadata() (+24 more)

### Community 36 - "detect-antipatterns.mjs"
Cohesion: 0.14
Nodes (27): confirm(), detectCli(), formatFindings(), formatFindingSummary(), handleStdin(), printUsage(), loadDesignSystemForCwd(), parseFrontmatter() (+19 more)

### Community 37 - "live-accept.mjs"
Cohesion: 0.14
Nodes (32): acceptCli(), argVal(), buildCarbonizeReplacement(), decodeHtmlAttr(), deindentContent(), detectCommentSyntax(), escapeRegExp(), expandReplaceRange() (+24 more)

### Community 38 - "initPageChat"
Cohesion: 0.13
Nodes (33): armPageChatForTyping(), clearSteerAwaitTimer(), collapsePageChat(), expandPageChat(), finishVoiceSession(), focusPageChatInput(), initPageChat(), isEmbeddedPreviewBrowser() (+25 more)

### Community 39 - "claude_digest.py"
Cohesion: 0.10
Nodes (31): count_commands(), decode_project_path(), extract_files(), extract_text_content(), extract_title(), extract_tool_uses(), format_json(), format_text() (+23 more)

### Community 40 - "live-copy-edit-agent.mjs"
Cohesion: 0.14
Nodes (31): applyMockWrites(), buildCopyEditBatchPrompt(), checkFrameworkSourceSyntax(), chooseCopyEditAgent(), COMMAND_AUTH_CACHE, commandAuthed(), commandExists(), compactBatchForPrompt() (+23 more)

### Community 41 - "app-shell.tsx"
Cohesion: 0.13
Nodes (23): AppShell(), AssistantMessage, AssistenteLoaPage(), ImportOption, SUGGESTIONS, SettingsView(), Sidebar(), ROLE_LABELS (+15 more)

### Community 42 - "parseRgb"
Cohesion: 0.13
Nodes (31): analyzeVisualContrast(), analyzeVisualContrastCandidate(), checkColors(), checkElementAIPaletteDOM(), checkElementColors(), checkElementColorsDOM(), checkElementGlow(), checkElementGlowDOM() (+23 more)

### Community 43 - "loa/route.ts"
Cohesion: 0.14
Nodes (25): buildClassificationGroups(), buildQualitySummary(), buildWhere(), distinctCount(), GET(), groupBy(), normalizeGroups(), QualityRow (+17 more)

### Community 44 - "consultaReceitas.ts"
Cohesion: 0.14
Nodes (17): GET(), GET(), GET(), GET(), GET(), GET(), GET(), GET() (+9 more)

### Community 45 - "detectHtml"
Cohesion: 0.10
Nodes (7): buildStaticWindow(), collectStaticCssText(), StaticDocument, StaticElement, checkStaticPageTypography(), detectHtml(), checkHtmlPatterns()

### Community 46 - "runHook"
Cohesion: 0.12
Nodes (27): bumpEditCount(), coLocatedStylesheets(), dedupeAgainstCache(), depthIsSet(), ensureFile(), ensureSession(), expandScanTargets(), findingCacheKey() (+19 more)

### Community 47 - "live-poll.mjs"
Cohesion: 0.15
Nodes (26): completionAckForAcceptResult(), completionTypeForAcceptResult(), augmentEventWithAcceptHandling(), buildAcceptScriptArgs(), buildPollReplyPayload(), DEFAULT_EVENT_LEASE_MS, EVENT_TYPES_NEEDING_AGENT_REPLY, fetchNextEvent() (+18 more)

### Community 48 - "rest-api-template.py"
Cohesion: 0.13
Nodes (26): create_user(), delete_user(), ErrorDetail, ErrorResponse, get_user(), http_exception_handler(), list_users(), PaginatedResponse (+18 more)

### Community 49 - "inspect.py"
Cohesion: 0.13
Nodes (25): inspect(), main(), _part_target(), Path, ZipFile, Read a PPTX OOXML package into a compact, JSON-safe inspection report., Write UTF-8 JSON without depending on the console code page., _relationships() (+17 more)

### Community 50 - "PromptOptimizer"
Cohesion: 0.11
Nodes (15): main(), PromptOptimizer, process_test_case(), Any, Iteratively optimize a prompt., Generate prompt variations to test., Remove redundant words to make prompt more concise., Prompt Optimization Script Automatically test and optimize prompts using A/B… (+7 more)

### Community 51 - "parser.ts"
Cohesion: 0.14
Nodes (19): main(), prisma, vitest, maxDuration, POST(), runtime, cleanImportFileName(), fileNameWithExercise() (+11 more)

### Community 52 - "$value"
Cohesion: 0.14
Nodes (26): lg, md, xl, lg, xl, $description, $type, $value (+18 more)

### Community 53 - "detect-url.mjs"
Cohesion: 0.18
Nodes (21): detectUrl(), runVisualContrastFallback(), serializeDesignSystemForBrowser(), runRegexMatchers(), captureVisualContrastCandidate(), compareScreenshotContrast(), sanitizeScreenshotClip(), finding() (+13 more)

### Community 54 - "handleManualEditActivity"
Cohesion: 0.18
Nodes (26): clearStoredManualApplyState(), fetchPendingCount(), handleManualEditActivity(), hidePendingApplyDock(), manualApplyLoadingText(), manualApplyStateKey(), manualEditEventForCurrentPage(), numberOrNull() (+18 more)

### Community 55 - "manual-edit-routes.mjs"
Cohesion: 0.19
Nodes (22): args, buffer, cwd, pageUrlFilter, remaining, compactManualLogText(), summarizeManualApplyFailures(), summarizeManualDiagnostics() (+14 more)

### Community 56 - "live-manual-edit-evidence.mjs"
Cohesion: 0.15
Nodes (25): analyzeSourceHint(), buildCandidatesForOp(), buildContextHintsByRef(), collectSearchFiles(), countOps(), decodeBasicHtml(), escapeRegExp(), findContextMatches() (+17 more)

### Community 57 - "BaseSpecification"
Cohesion: 0.12
Nodes (19): Func, BaseSpecification, Criteria, Includes, IncludeStrings, OrderBy, OrderByDescending, Skip (+11 more)

### Community 58 - "ldo-receita-view.tsx"
Cohesion: 0.09
Nodes (15): HistoricoItem, LdoKpis, LdoReceitaView(), LdoRegistro, VinculoComparativo, ApiResponse, FiltrosAnaliticos, ReceitaArrecadadaAnaliticaView() (+7 more)

### Community 59 - "parseRgb"
Cohesion: 0.20
Nodes (22): checkColors(), checkElementAIPaletteDOM(), checkElementColors(), checkElementColorsDOM(), checkElementGlow(), checkElementGlowDOM(), checkElementIconTile(), checkElementIconTileDOM() (+14 more)

### Community 60 - "package.json"
Cohesion: 0.09
Nodes (22): name, overrides, @types/react, @types/react-dom, private, version, eslint, eslint-config-next (+14 more)

### Community 61 - "react"
Cohesion: 0.10
Nodes (11): react, LoginView(), EvolucaoItem, ResumoData, RevenueDetailView(), BadgeProps, Button, ButtonProps (+3 more)

### Community 62 - "impeccable-paths.mjs"
Cohesion: 0.17
Nodes (21): resolveProjectRoot(), CRITIQUE_DIR, firstExisting(), getDesignSidecarCandidates(), getDesignSidecarPath(), getImpeccableDir(), getLegacyLiveAnnotationsDir(), getLegacyLiveConfigPath() (+13 more)

### Community 63 - "PerformanceChecker"
Cohesion: 0.15
Nodes (11): main(), PerformanceChecker, Check for data fetching in useEffect (Section 4), Check for missing React.memo, useMemo, useCallback (Section 5), Check for unoptimized images (Section 6), Generate final report, React Performance Checker Automated performance audit for React/Next.js…, Yield project files matching the given extensions. pathlib.rglob does NOT… (+3 more)

### Community 64 - "parseAnyColor"
Cohesion: 0.12
Nodes (21): borderColorsFromStyle(), borderWidthsFromStyle(), browserColorsClose(), browserHasDirectText(), browserRadiusTokens(), browserSampleText(), checkCreamPalette(), checkElementDesignSystemDOM() (+13 more)

### Community 65 - "captureElementToBlob"
Cohesion: 0.12
Nodes (20): averageRgb01(), captureChromeNodes(), captureElementFromRenderedAncestor(), captureElementToBlob(), compileShader(), cssColorToRgb01(), dominantRgb01(), findBackdropAncestor() (+12 more)

### Community 66 - "importacaoReceitas.ts"
Cohesion: 0.16
Nodes (16): DELETE(), POST(), POST(), POST(), desfazerImportacao(), ErroDetalhe, HEADER_ALIASES, inferExercise() (+8 more)

### Community 67 - "dashboard-data.ts"
Cohesion: 0.17
Nodes (18): applyFilters(), buildDemoDashboardData(), buildGroups(), buildMappedGroups(), DashboardRow, distinctCount(), EMPTY_FILTER_FIELD_MAP, mapDemoRecord() (+10 more)

### Community 68 - "typography"
Cohesion: 0.12
Nodes (20): tight, wide, loose, relaxed, tight, $description, $type, $value (+12 more)

### Community 69 - "data-table.tsx"
Cohesion: 0.21
Nodes (17): DataTable(), exportExcel(), exportPdf(), Row, FIELD_LABELS, downloadLoaReportHtml(), escapeHtml(), formatTableCell() (+9 more)

### Community 70 - "geo_checker.py"
Cohesion: 0.16
Nodes (17): check_page(), find_web_pages(), is_page_file(), main(), Path, Check a single web page for GEO elements., GEO Checker - Generative Engine Optimization Audit Checks PUBLIC WEB CONTENT…, Check if this file is likely a public-facing page. (+9 more)

### Community 71 - "validate_handoff.py"
Cohesion: 0.15
Nodes (18): calculate_quality_score(), check_file_references(), check_recommended_sections(), check_required_sections(), check_todos(), main(), print_report(), Check if referenced files exist. (+10 more)

### Community 72 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 73 - "live.mjs"
Cohesion: 0.21
Nodes (14): loadContext(), safeRead(), parseTargetOptions(), parseTargetPath(), TargetArgError, __dirname, ensureServerRunning(), globToRegex() (+6 more)

### Community 74 - "resolveLengthPx"
Cohesion: 0.15
Nodes (18): checkElementQuality(), checkElementQualityDOM(), checkQuality(), checkRepeatedSectionKickers(), checkRepeatedSectionKickersDOM(), checkRepeatedSectionKickersFromDoc(), cleanInlineText(), collectRepeatedSectionKickerCandidates() (+10 more)

### Community 75 - "MemeGenerator"
Cohesion: 0.12
Nodes (11): main(), MemeGenerator, Suggest a template based on context. Args: context: Description of the…, List all available templates with descriptions. Returns: Dictionary of template…, Generate markdown for embedding the meme image. Args: url: The meme URL…, CLI interface for the meme generator., Meme Generator Helper. A Python interface for the memegen.link API to generate…, Generate memes using the memegen.link API. (+3 more)

### Community 76 - "xlsx"
Cohesion: 0.16
Nodes (11): xlsx, ExpenseWithoutSubelement, maxDuration, POST(), runtime, clean(), LdoActionParseResult, LdoActionRow (+3 more)

### Community 77 - "auth.ts"
Cohesion: 0.22
Nodes (12): POST(), GET(), base64UrlDecode(), base64UrlEncode(), hashPassword(), SESSION_COOKIE_NAME, signSession(), stringToUint8Array() (+4 more)

### Community 78 - "onAnnotDown"
Cohesion: 0.20
Nodes (17): beginEditPin(), buildAnnotationsForCapture(), buildPinElement(), cancelEditingPin(), clampPlaceholderSize(), finalizeEditingPin(), initAnnotOverlay(), localCoords() (+9 more)

### Community 79 - "createLiveBrowserSessionState"
Cohesion: 0.20
Nodes (14): createLiveBrowserSessionState(), clearHandled(), clearScrollY(), clearSession(), isHandled(), loadSession(), markHandled(), nextCheckpointRevision() (+6 more)

### Community 80 - "auxiliary-tables-parser.ts"
Cohesion: 0.18
Nodes (13): maxDuration, POST(), runtime, PlanningImportCard(), selectFile(), AuxiliaryCodeRow, AuxiliaryTablesParseResult, clean() (+5 more)

### Community 81 - "analise-loa-advanced-filters.tsx"
Cohesion: 0.15
Nodes (12): ALL_FILTER_KEYS, AnaliseLoaAdvancedFilters, AnaliseLoaAdvancedFiltersProps, LABELS_MAP, TechnicalFilterState, FilterCustomizePopover(), FilterCustomizePopoverProps, FilterFieldDefinition (+4 more)

### Community 82 - "banco-projetos-card.tsx"
Cohesion: 0.16
Nodes (14): BancoProjetoFormData, BancoProjetoFormDialog(), NATUREZAS_SUGERIDAS, Props, BancoProjetoAllocation, BancoProjetoLinha, BancoProjetosCard(), BancoProjetosFilters (+6 more)

### Community 83 - "checklist.py"
Cohesion: 0.23
Nodes (15): check_script_exists(), Colors, main(), print_error(), print_header(), print_step(), print_success(), print_summary() (+7 more)

### Community 84 - "scripts"
Cohesion: 0.12
Nodes (16): scripts, build, db:generate, db:push, db:seed:usuarios, dev, dev:staging, lint (+8 more)

### Community 85 - "enquadramento-rules.ts"
Cohesion: 0.21
Nodes (12): GET(), ClassificationPanel(), CAPITAL_KEYWORDS, EnquadramentoRuleMessage, isGenericExpenseCode(), normalizeBudgetCode(), normalizeText(), RuleSeverity (+4 more)

### Community 86 - "verify_all.py"
Cohesion: 0.25
Nodes (14): Colors, main(), print_error(), print_final_report(), print_header(), print_step(), print_success(), print_warning() (+6 more)

### Community 87 - "fontSize"
Cohesion: 0.13
Nodes (15): $description, $type, $value, $description, $type, $value, $description, $type (+7 more)

### Community 88 - "sampleCssBackground"
Cohesion: 0.20
Nodes (15): blendRgba(), clampByte(), firstCssUrl(), getLayerValue(), loadVisualContrastImage(), parseObjectPosition(), parsePositionPair(), parsePositionToken() (+7 more)

### Community 89 - "createLiveBrowserDomHelpers"
Cohesion: 0.19
Nodes (11): createLiveBrowserDomHelpers(), activeElementDeep(), cssId(), liveUiRoot(), makeFrozenAnchor(), own(), pickable(), rectIsUsableAnchor() (+3 more)

### Community 90 - "list_handoffs.py"
Cohesion: 0.21
Nodes (14): check_completion_status(), extract_title(), format_date(), list_handoffs(), main(), parse_date_from_filename(), datetime, Path (+6 more)

### Community 91 - "context-signals.mjs"
Cohesion: 0.24
Nodes (12): extractRegister(), cli(), COMMON_DEV_PORTS, devServerSignals(), gatherSignals(), gitSignals(), hasCode(), latestCritique() (+4 more)

### Community 92 - "setup_test_env.py"
Cohesion: 0.21
Nodes (13): clean_test_env(), create_sample_handoffs(), create_test_project(), init_git_repo(), main(), Path, Initialize git repo with commit history., Create sample handoff documents for testing. (+5 more)

### Community 93 - "run_full_scan"
Cohesion: 0.24
Nodes (13): main(), Any, Validate no hardcoded secrets (OWASP A04). Checks: API keys, tokens, passwords,…, Skill: vulnerability-scanner Script: security_scan.py Purpose: Validate that…, Validate dangerous code patterns (OWASP A05). Checks: Injection risks, XSS,…, Validate security configuration (OWASP A02). Checks: Security headers, CORS,…, Execute security validation scans., Validate supply chain security (OWASP A03). Checks: npm audit, lock file… (+5 more)

### Community 94 - "auditoria-orcamentaria-modal.tsx"
Cohesion: 0.18
Nodes (11): AlteracaoItem, AuditModalProps, AuditoriaOrcamentariaModal(), currency, dateFormat, ExclusaoItem, UserManagementSection(), UsuarioItem (+3 more)

### Community 95 - "component-template.tsx"
Cohesion: 0.15
Nodes (5): Component, ComponentProps, ComponentSize, componentStyles, ComponentVariant

### Community 96 - "borderRadius"
Cohesion: 0.18
Nodes (13): $description, $type, $value, borderRadius, 2xl, full, none, 2xl (+5 more)

### Community 97 - "fontWeight"
Cohesion: 0.15
Nodes (13): $description, $type, $value, bold, medium, semibold, $description, $type (+5 more)

### Community 98 - "default"
Cohesion: 0.15
Nodes (13): default, strong, subtle, $description, $type, $value, border, $description (+5 more)

### Community 99 - "feedback"
Cohesion: 0.15
Nodes (13): info, success, warning, $description, $type, $value, feedback, $description (+5 more)

### Community 100 - "mono"
Cohesion: 0.15
Nodes (13): mono, sans, serif, $description, $type, $value, $description, $type (+5 more)

### Community 101 - "critique-storage.mjs"
Cohesion: 0.32
Nodes (11): kebab(), listSnapshotsForSlug(), main(), nowFilenameStamp(), parseFrontmatter(), readLatestSnapshot(), readTrend(), serializeFrontmatter() (+3 more)

### Community 102 - "scheduleLazyVisualContrast"
Cohesion: 0.18
Nodes (13): addBrowserFindings(), addVisualContrastFindings(), addVisualContrastResult(), clearOverlays(), detachOverlay(), disconnectLazyVisualContrastObserver(), postExtensionError(), rememberVisualContrastAnalysis() (+5 more)

### Community 103 - "collectBrowserFindings"
Cohesion: 0.18
Nodes (13): browserDesignSystemConfig(), browserFindingsFromMap(), browserPrimaryFont(), checkBrowserDesignSystemSources(), checkHtmlPatterns(), checkPageQualityDOM(), checkPageQualityFromDoc(), checkTypography() (+5 more)

### Community 104 - "resolveLiveInjectionAnchor"
Cohesion: 0.24
Nodes (13): buildSvelteExpressionTextMap(), buildSveltePropValuesFromLiveElement(), collectTextNodes(), elementMatchesOriginalMarkup(), escapeRegExp(), expressionTextMatcher(), findLiveElementForOriginalMarkup(), findLiveElementFromAnchorSnapshot() (+5 more)

### Community 105 - "convert_rules.py"
Cohesion: 0.23
Nodes (12): generate_section_file(), group_rules_by_section(), main(), parse_frontmatter(), parse_rule_file(), Path, Group all rules by their section prefix, Generate a merged section file (+4 more)

### Community 106 - "devDependencies"
Cohesion: 0.15
Nodes (13): devDependencies, eslint, eslint-config-next, @eslint/eslintrc, @playwright/test, prisma, tailwindcss, @tailwindcss/postcss (+5 more)

### Community 107 - "enquadramentos/route.ts"
Cohesion: 0.31
Nodes (8): GET(), POST(), ExistingLoaExpense, getExistingLoaExpenses(), getExistingLoaTotal(), normalizeSecretariat(), getLoaSecretariatNames(), normalizeCode()

### Community 108 - "UnitOfWork"
Cohesion: 0.20
Nodes (9): IUnitOfWork, Orders, Products, UnitOfWork, Orders, Products, IDbContextTransaction, IDisposable (+1 more)

### Community 109 - "i18n_checker.py"
Cohesion: 0.24
Nodes (11): check_hardcoded_strings(), check_locale_completeness(), find_locale_files(), flatten_keys(), main(), Path, Flatten nested dict keys., Check for hardcoded strings in code files. (+3 more)

### Community 110 - "gerar_exportacao_modificados.cjs"
Cohesion: 0.20
Nodes (8): clean(), code(), fs, headers, normalizeProgram(), prisma, { PrismaClient }, XLSX

### Community 111 - "detect-csp.mjs"
Cohesion: 0.20
Nodes (10): detectCsp(), INLINE_HEADER_SIGNALS, LAYOUT_EXTS, MONOREPO_HELPER_SIGNALS, NUXT_ROUTE_RULES_SIGNALS, NUXT_SECURITY_SIGNALS, SCAN_EXTS, SKIP_DIRS (+2 more)

### Community 112 - "palette.mjs"
Cohesion: 0.24
Nodes (7): args, buildWeights(), hashUnit(), pickSeed(), seed, SEEDS, weightedPick()

### Community 113 - "pin.mjs"
Cohesion: 0.25
Nodes (9): __dirname, findHarnessDirs(), generatePinnedSkill(), HARNESS_DIRS, loadCommandMetadata(), pin(), root, unpin() (+1 more)

### Community 114 - "update_plugin_version"
Cohesion: 0.25
Nodes (10): bump_version(), main(), parse_version(), Path, Parse semantic version string into tuple., Bump plugin version in both plugin.json and marketplace.json., Bump semantic version., Update version in both plugin.json and marketplace.json. (+2 more)

### Community 115 - "session_manager.py"
Cohesion: 0.42
Nodes (9): analyze_package_json(), count_files(), detect_features(), get_project_root(), main(), print_status(), Any, Path (+1 more)

### Community 116 - "api_validator.py"
Cohesion: 0.31
Nodes (9): check_api_code(), check_openapi_spec(), find_api_files(), main(), Path, Find API-related files., API Validator - Checks API endpoints for best practices. Validates OpenAPI…, Check OpenAPI/Swagger specification. (+1 more)

### Community 117 - "design-tokens-template.json"
Cohesion: 0.20
Nodes (9): padding, component, button, name, sm, $schema, x, version (+1 more)

### Community 118 - "brand"
Cohesion: 0.20
Nodes (10): primary-active, primary-hover, secondary-hover, $type, $value, $type, $value, $type (+2 more)

### Community 119 - "normalizeIgnoreValueEntries"
Cohesion: 0.36
Nodes (10): cleanIgnoreValueDisplay(), extractFindingIgnoreValue(), extractFindingIgnoreValueRaw(), extractMotionIgnoreValue(), filterFindings(), formatFindingIgnoreCommand(), isIgnoredFindingValue(), normalizeIgnoreRule() (+2 more)

### Community 120 - "syncEditBadgeHitProxies"
Cohesion: 0.27
Nodes (10): bindEditBadgeProxy(), editBadgeProxyTargets(), initEditBadge(), initEditBadgeHitProxies(), positionEditBadge(), proxyMouseEvent(), setImportantStyle(), styleEditBadgeProxy() (+2 more)

### Community 121 - "ui-core.mjs"
Cohesion: 0.29
Nodes (8): appendStyleToLiveUiRoot(), appendToLiveUiRoot(), escapeCssIdent(), getLiveUiElementById(), LIVE_CHROME_MOUNT_CONTRACT, LIVE_UI_COMPONENT_IDS, LIVE_UI_SURFACES, resolveLiveUiRoot()

### Community 122 - "dependencies"
Cohesion: 0.20
Nodes (10): dependencies, jspdf, jspdf-autotable, lucide-react, next, @prisma/client, react, react-dom (+2 more)

### Community 123 - "agent/route.ts"
Cohesion: 0.36
Nodes (9): AgentRequest, formatCurrency(), getGroupLabel(), inferIntent(), Intent, normalize(), POST(), readJson() (+1 more)

### Community 124 - "auto_preview.py"
Cohesion: 0.44
Nodes (8): get_project_root(), get_start_command(), is_running(), main(), Auto Preview - AG Kit ============================== Manages…, start_server(), status_server(), stop_server()

### Community 125 - "blue"
Cohesion: 0.22
Nodes (9): $type, $value, primitive, black, blue, white, yellow, $type (+1 more)

### Community 126 - "text"
Cohesion: 0.22
Nodes (9): $description, $type, $value, $description, $type, $value, text, disabled (+1 more)

### Community 127 - "PagedResult"
Cohesion: 0.22
Nodes (9): IReadOnlyList, PagedResult, HasNextPage, HasPreviousPage, Items, Page, PageSize, TotalCount (+1 more)

### Community 128 - "postSerializedFindings"
Cohesion: 0.25
Nodes (9): buildSelectorSegment(), generateSelector(), isElementHidden(), isLikelyHashedClass(), postSerializedFindings(), renderBrowserFindings(), scanResultMeta(), serializeFindings() (+1 more)

### Community 129 - "unpack.py"
Cohesion: 0.39
Nodes (8): main(), Path, ZipFile, Safely unpack an Office ZIP package and pretty-print XML for inspection., unpack(), _validate_members(), _workspace_path(), ZipInfo

### Community 130 - "layout.tsx"
Cohesion: 0.22
Nodes (6): nextConfig, next, inter, metadata, outfit, publicSans

### Community 131 - "schema_validator.py"
Cohesion: 0.36
Nodes (7): find_schema_files(), main(), Path, Schema Validator - Database schema validation Validates Prisma schemas and…, Find database schema files., Validate Prisma schema file., validate_prisma_schema()

### Community 132 - "red"
Cohesion: 0.39
Nodes (8): $type, $value, 100, 100, 100, red, 100, 100

### Community 133 - "green"
Cohesion: 0.39
Nodes (8): $type, $value, 200, 200, 200, green, 200, 200

### Community 134 - "gray"
Cohesion: 0.39
Nodes (8): $type, $value, 50, 50, 50, gray, 50, 50

### Community 135 - "semantic"
Cohesion: 0.32
Nodes (8): tertiary, color, semantic, background, $description, $type, $value, tertiary

### Community 136 - "accessibility_checker.py"
Cohesion: 0.36
Nodes (7): check_accessibility(), find_html_files(), main(), Path, Accessibility Checker - WCAG compliance audit Checks HTML files for…, Find all HTML/JSX/TSX files., Check a single file for accessibility issues.

### Community 137 - "UXAuditor"
Cohesion: 0.32
Nodes (3): main(), UX Audit Script - Full Frontend Design Coverage Analyzes code for compliance…, UXAuditor

### Community 138 - "isScreenReaderOnlyTextStyle"
Cohesion: 0.32
Nodes (8): checkElementTextOverflowDOM(), classSelector(), clippedByInset(), clippedByRect(), expandBoxShorthand(), firstMetricLengthPx(), isScreenReaderOnlyTextStyle(), metricLengthPx()

### Community 139 - "renderTemplate"
Cohesion: 0.32
Nodes (8): cursorBlockMessage(), clampGroupedToBudget(), clampToBudget(), directiveFooter(), formatFindingLine(), quoteCommandArg(), renderGroupedTemplate(), renderTemplate()

### Community 140 - "lint_runner.py"
Cohesion: 0.36
Nodes (7): detect_project_type(), main(), Path, Lint Runner - Unified linting and type checking Runs appropriate linters based…, Detect project type and available linters., Run a single linter and return results., run_linter()

### Community 141 - "type_coverage.py"
Cohesion: 0.36
Nodes (7): check_python_coverage(), check_typescript_coverage(), main(), Path, Check TypeScript type coverage., Type Coverage Checker - Measures TypeScript/Python type coverage. Identifies…, Check Python type hints coverage.

### Community 142 - "MobileAuditor"
Cohesion: 0.32
Nodes (3): main(), MobileAuditor, Mobile UX Audit Script - Full Mobile Design Coverage Analyzes React Native /…

### Community 143 - "test_runner.py"
Cohesion: 0.36
Nodes (7): detect_test_framework(), main(), Path, Test Runner - Unified test execution and coverage reporting Runs tests and…, Detect test framework and commands., Run tests and return results., run_tests()

### Community 144 - "ldo-parser.ts"
Cohesion: 0.39
Nodes (5): POST(), POST(), LdoParseResult, LdoRowRaw, parseLdoWorkbook()

### Community 145 - "$type"
Cohesion: 0.48
Nodes (7): $type, $value, 300, 300, 300, 300, 300

### Community 146 - "$type"
Cohesion: 0.48
Nodes (7): $type, $value, 400, 400, 400, 400, 400

### Community 147 - "$type"
Cohesion: 0.48
Nodes (7): $type, $value, 500, 500, 500, 500, 500

### Community 148 - "$type"
Cohesion: 0.48
Nodes (7): $type, $value, 600, 600, 600, 600, 600

### Community 149 - "$type"
Cohesion: 0.48
Nodes (7): $type, $value, 700, 700, 700, 700, 700

### Community 150 - "$type"
Cohesion: 0.48
Nodes (7): $type, $value, 800, 800, 800, 800, 800

### Community 151 - "$type"
Cohesion: 0.48
Nodes (7): $type, $value, 900, 900, 900, 900, 900

### Community 152 - "$type"
Cohesion: 0.48
Nodes (7): $type, $value, 950, 950, 950, 950, 950

### Community 153 - "analises-combinadas.tsx"
Cohesion: 0.29
Nodes (5): AnalisesCombinadasSection(), BaseStatusType, StatusBases, TableRow, TotaisBases

### Community 154 - "primary"
Cohesion: 0.60
Nodes (6): primary, primary, $description, $type, $value, primary

### Community 155 - "secondary"
Cohesion: 0.53
Nodes (6): secondary, secondary, $description, $type, $value, secondary

### Community 156 - "$value"
Cohesion: 0.53
Nodes (6): $description, $type, $value, base, base, base

### Community 157 - "$value"
Cohesion: 0.53
Nodes (6): sm, sm, sm, $description, $type, $value

### Community 158 - "normal"
Cohesion: 0.60
Nodes (6): normal, normal, normal, $description, $type, $value

### Community 159 - "ProductServiceOptions"
Cohesion: 0.33
Nodes (6): ProductServiceOptions, CacheDuration, DefaultPageSize, EnableEnrichment, MaxPageSize, TimeSpan

### Community 160 - "find_aws_icon.py"
Cohesion: 0.47
Nodes (5): load_icon_data(), main(), AWS アイコン検索スクリプト references/aws-icons.md からサービス名でアイコン情報を検索する。…, aws-icons.md からアイコンデータを読み込む, search_icon()

### Community 161 - "lighthouse_audit.py"
Cohesion: 0.40
Nodes (5): get_summary(), Run Lighthouse audit on URL., Skill: performance-profiling Script: lighthouse_audit.py Purpose: Run…, Generate summary based on scores., run_lighthouse()

### Community 162 - "create_plugin_structure"
Cohesion: 0.40
Nodes (5): create_plugin_structure(), main(), Path, Create complete plugin directory structure with manifests., Create a new Claude Code plugin with proper directory structure and manifests.

### Community 163 - "playwright_runner.py"
Cohesion: 0.33
Nodes (5): Run basic accessibility check., Skill: webapp-testing Script: playwright_runner.py Purpose: Run basic…, Run basic browser test on URL., run_accessibility_check(), run_basic_test()

### Community 164 - "clean_ldo_actions_exact.ts"
Cohesion: 0.47
Nodes (5): extractCode(), findRefSec(), main(), prisma, refTable

### Community 165 - "final_perfect_ldo_loa_sync.ts"
Cohesion: 0.47
Nodes (5): extractCode(), findRefSec(), main(), prisma, refTable

### Community 166 - "fix_ldo_db_clean.ts"
Cohesion: 0.47
Nodes (5): extractCode(), findRefSec(), main(), prisma, refTable

### Community 167 - "guarantee_100_percent_match.ts"
Cohesion: 0.47
Nodes (5): extractCode(), main(), matches(), prisma, refTable

### Community 168 - "normalize_all_actions_in_db.ts"
Cohesion: 0.53
Nodes (5): ACTION_CANONICAL_MAP, extractActionCode(), getCanonicalActionLabel(), main(), prisma

### Community 169 - "seed_usuarios.ts"
Cohesion: 0.40
Nodes (5): hashPassword(), prisma, SeedUser, seedUsuarios(), USUARIOS_PADRAO

### Community 170 - "budget-calculation-service.ts"
Cohesion: 0.47
Nodes (4): BudgetMetricItem, calculateBudgetMetrics(), CalculatedBudgetMetrics, calculateDifferenceStatus()

### Community 171 - "validate-chart.sh"
Cohesion: 0.70
Nodes (4): error(), validate-chart.sh script, success(), warning()

### Community 172 - "checkElementHeroEyebrow"
Cohesion: 0.40
Nodes (5): checkElementHeroEyebrow(), checkElementHeroEyebrowDOM(), checkHeroEyebrow(), isAccentColor(), resolveVarRefs()

### Community 173 - "isGeneratedFile"
Cohesion: 0.60
Nodes (4): hasGeneratedHeader(), HEADER_MARKERS, isGeneratedFile(), isGitIgnored()

### Community 174 - "sync_db_to_reference_image.ts"
Cohesion: 0.50
Nodes (4): main(), matchesSecretaria(), prisma, refTable

### Community 175 - "spacing"
Cohesion: 0.50
Nodes (4): $type, $value, spacing, 0

### Community 176 - "10"
Cohesion: 0.50
Nodes (4): $description, $type, $value, 10

### Community 177 - "12"
Cohesion: 0.50
Nodes (4): $description, $type, $value, 12

### Community 178 - "16"
Cohesion: 0.50
Nodes (4): $description, $type, $value, 16

### Community 179 - "1"
Cohesion: 0.50
Nodes (4): $description, $type, $value, 1

### Community 180 - "20"
Cohesion: 0.50
Nodes (4): $description, $type, $value, 20

### Community 181 - "24"
Cohesion: 0.50
Nodes (4): $description, $type, $value, 24

### Community 182 - "2"
Cohesion: 0.50
Nodes (4): $description, $type, $value, 2

### Community 183 - "3"
Cohesion: 0.50
Nodes (4): $description, $type, $value, 3

### Community 184 - "4"
Cohesion: 0.50
Nodes (4): $description, $type, $value, 4

### Community 185 - "5"
Cohesion: 0.50
Nodes (4): $description, $type, $value, 5

### Community 186 - "6"
Cohesion: 0.50
Nodes (4): $description, $type, $value, 6

### Community 187 - "8"
Cohesion: 0.50
Nodes (4): $description, $type, $value, 8

### Community 188 - "error"
Cohesion: 0.50
Nodes (4): $description, $type, $value, error

### Community 189 - "detect.mjs"
Cohesion: 0.50
Nodes (3): candidates, detectorPath, __dirname

### Community 190 - "eslint.config.mjs"
Cohesion: 0.50
Nodes (3): compat, config, @eslint/eslintrc

## Knowledge Gaps
- **620 isolated node(s):** `ExistingLoaExpense`, `AgentRequest`, `Intent`, `ExpenseElementOption`, `Props` (+615 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 985 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `@prisma/client` connect `@prisma/client` to `importacaoReceitas.ts`, `clean_ldo_actions_exact.ts`, `final_perfect_ldo_loa_sync.ts`, `fix_ldo_db_clean.ts`, `guarantee_100_percent_match.ts`, `normalize_all_actions_in_db.ts`, `seed_usuarios.ts`, `enquadramentos/route.ts`, `xlsx`, `loa/route.ts`, `sync_db_to_reference_image.ts`, `consultaReceitas.ts`, `gerar_exportacao_modificados.cjs`, `parser.ts`, `package.json`, `db.ts`?**
  _High betweenness centrality (0.016) - this node is a cross-community bridge._
- **Why does `react` connect `react` to `importar/page.tsx`, `analytic-dashboard-layout.tsx`, `app-shell.tsx`, `analise-loa-view.tsx`, `analise-loa-advanced-filters.tsx`, `banco-projetos-card.tsx`, `format.ts`, `presentation-dashboard.tsx`, `analises-combinadas.tsx`, `ldo-receita-view.tsx`, `package.json`, `auditoria-orcamentaria-modal.tsx`, `component-template.tsx`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **Why does `xlsx` connect `xlsx` to `importacaoReceitas.ts`, `data-table.tsx`, `@prisma/client`, `enquadramentos/route.ts`, `analise-loa-view.tsx`, `gerar_exportacao_modificados.cjs`, `auxiliary-tables-parser.ts`, `ldo-parser.ts`, `banco-projetos-card.tsx`, `parser.ts`, `format.ts`, `package.json`?**
  _High betweenness centrality (0.004) - this node is a cross-community bridge._
- **Are the 7 inferred relationships involving `initGlobalBar()` (e.g. with `hideAgentPollTooltip()` and `onDetectMessage()`) actually correct?**
  _`initGlobalBar()` has 7 INFERRED edges - model-reasoned connections that need verification._
- **What connects `ExistingLoaExpense`, `AgentRequest`, `Intent` to the rest of the system?**
  _620 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `live-browser.js` be split into smaller, more focused modules?**
  _Cohesion score 0.02863984674329502 - nodes in this community are weakly interconnected._
- **Should `checks.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.04569083447332421 - nodes in this community are weakly interconnected._