# FDA 510(k) Smart Analyzer: Flutter Transformation & Deployment Guide

## 1. Project Overview & Architecture

This guide details how to reconstruct the FDA 510(k) Smart Analyzer as a **Flutter Web Application**. Flutter offers significant advantages for this use case, including a unified codebase for Web, iOS, and Android, and a high-performance rendering engine (CanvasKit) that ensures the "Artistic Styles" and complex layouts render identically across all devices.

### 1.1 Architecture Pattern
We will use a **Feature-First Architecture** with **Riverpod** for state management.
*   **Presentation Layer**: Widgets, StateNotifiers.
*   **Domain Layer**: Entities (Analysis Results), Repository Interfaces.
*   **Data Layer**: Google GenAI implementation, File pickers.

### 1.2 Tech Stack
*   **Framework**: Flutter (Channel: Stable)
*   **Language**: Dart 3.0+
*   **AI SDK**: `google_generative_ai`
*   **State Management**: `flutter_riverpod`
*   **UI System**: Material 3 (Material You)

---

## 2. Dependencies (`pubspec.yaml`)

Add the following packages to your `pubspec.yaml`:

```yaml
dependencies:
  flutter:
    sdk: flutter
  
  # AI & Networking
  google_generative_ai: ^0.2.0  # Official Gemini SDK
  
  # State Management
  flutter_riverpod: ^2.4.9
  
  # UI Utilities
  flutter_markdown: ^0.6.18     # For rendering markdown responses
  google_fonts: ^6.1.0          # For typography
  lucide_icons: ^0.3.0          # Matching the React icon set
  animate_do: ^3.3.2            # For UI transitions
  
  # File Handling
  file_picker: ^6.1.1           # Cross-platform file selection
  cross_file: ^0.3.3            # Unified file abstraction
  
  # Utilities
  shared_preferences: ^2.2.2    # For storing API Keys/Settings locally
  json_annotation: ^4.8.1

dev_dependencies:
  flutter_test:
    sdk: flutter
  build_runner: ^2.4.8
  json_serializable: ^6.7.1
```

---

## 3. Core Implementation

### 3.1 Main Entry Point (`lib/main.dart`)
Sets up the ProviderScope and the dynamic theming system.

```dart
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'features/home/home_screen.dart';
import 'core/theme/app_theme.dart';
import 'core/providers/settings_provider.dart';

void main() {
  runApp(const ProviderScope(child: FdaAnalyzerApp()));
}

class FdaAnalyzerApp extends ConsumerWidget {
  const FdaAnalyzerApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeModeProvider);
    final artistStyle = ref.watch(artistStyleProvider);

    return MaterialApp(
      title: 'FDA 510(k) Smart Analyzer',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.getTheme(artistStyle, Brightness.light),
      darkTheme: AppTheme.getTheme(artistStyle, Brightness.dark),
      themeMode: themeMode,
      home: const HomeScreen(),
    );
  }
}
```

### 3.2 The Gemini Service (`lib/services/gemini_service.dart`)
Handles the interaction with Google's GenAI SDK. Note that in Flutter, we use the `google_generative_ai` package directly.

```dart
import 'package:google_generative_ai/google_generative_ai.dart';

class GeminiService {
  final String apiKey;
  late final GenerativeModel _modelFlash;
  late final GenerativeModel _modelPro;

  GeminiService(this.apiKey) {
    _modelFlash = GenerativeModel(model: 'gemini-2.5-flash', apiKey: apiKey);
    _modelPro = GenerativeModel(model: 'gemini-3-pro-preview', apiKey: apiKey);
  }

  Future<String> analyzeDocument(String prompt, DataPart? fileData, String modelName) async {
    final model = modelName.contains('pro') ? _modelPro : _modelFlash;
    
    final content = [
      Content.multi([
        if (fileData != null) fileData,
        TextPart(prompt),
      ])
    ];

    // Note: JSON Schema is enforced via prompt engineering or set generationConfig
    // In Dart SDK, we can use generationConfig responseMimeType: 'application/json'
    final response = await model.generateContent(
      content,
      generationConfig: GenerationConfig(responseMimeType: 'application/json'),
    );
    
    return response.text ?? '{}';
  }

  ChatSession startChat(String contextData, String modelName) {
    final model = modelName.contains('pro') ? _modelPro : _modelFlash;
    return model.startChat(history: [
      Content.text("System: You are an FDA expert. Here is the context: $contextData"),
      Content.model([TextPart("Understood. I am ready to answer questions regarding this 510(k).")])
    ]);
  }
}
```

### 3.3 Dynamic "Painter" Theme Engine (`lib/core/theme/app_theme.dart`)
Recreating the CSS Variable switching logic using Flutter's `ColorScheme.fromSeed`.

```dart
import 'package:flutter/material.dart';

enum PainterStyle {
  medicalDefault(Color(0xFF0F766E), "Default"),
  vanGogh(Color(0xFF1D4E89), "Van Gogh"),
  monet(Color(0xFF748B97), "Monet"),
  picasso(Color(0xFFE07A5F), "Picasso"),
  warhol(Color(0xFFFF1493), "Warhol");
  
  final Color seed;
  final String label;
  const PainterStyle(this.seed, this.label);
}

class AppTheme {
  static ThemeData getTheme(PainterStyle style, Brightness brightness) {
    return ThemeData(
      useMaterial3: true,
      colorScheme: ColorScheme.fromSeed(
        seedColor: style.seed,
        brightness: brightness,
      ),
      fontFamily: 'Roboto', // Or standard Flutter font
      cardTheme: CardTheme(
        elevation: 0,
        shape: RoundedRectangleBorder(
          side: BorderSide(color: Colors.grey.withOpacity(0.2)),
          borderRadius: BorderRadius.circular(12),
        ),
      ),
    );
  }
}
```

### 3.4 Responsive Dashboard Layout (`lib/features/dashboard/dashboard_screen.dart`)
Using `LayoutBuilder` to switch between Mobile (Tabs) and Desktop (Split View).

```dart
class DashboardScreen extends ConsumerWidget {
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final analysisData = ref.watch(analysisProvider);

    return Scaffold(
      appBar: AppBar(title: Text("FDA 510(k) Analyzer")),
      body: LayoutBuilder(
        builder: (context, constraints) {
          if (constraints.maxWidth > 900) {
            // Desktop Split View
            return Row(
              children: [
                Expanded(
                  flex: 2,
                  child: SingleChildScrollView(
                    padding: EdgeInsets.all(24),
                    child: AnalysisView(data: analysisData),
                  ),
                ),
                VerticalDivider(width: 1),
                Expanded(
                  flex: 1,
                  child: ChatWidget(),
                ),
              ],
            );
          } else {
            // Mobile Tab View
            return DefaultTabController(
              length: 2,
              child: Column(
                children: [
                  TabBar(tabs: [Tab(text: "Analysis"), Tab(text: "Chat")]),
                  Expanded(
                    child: TabBarView(
                      children: [
                        SingleChildScrollView(child: AnalysisView(data: analysisData)),
                        ChatWidget(),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }
        },
      ),
    );
  }
}
```

---

## 4. Netlify Deployment Guide (Flutter Web)

Netlify is an excellent host for Flutter Web apps. It offers global CDN, continuous deployment, and free SSL.

### Step 1: Optimize Flutter for Web
In your Flutter project root, run the following to enable web support (if not already enabled):
```bash
flutter config --enable-web
flutter create .
```

### Step 2: Handle Client-Side Routing
Flutter Web is a Single Page Application (SPA). If a user refreshes a page on a non-root URL, Netlify will throw a 404 because it looks for a real file.
**Solution**: Create a file named `_redirects` (no extension) in your project's `web/` folder.

**Content of `web/_redirects`:**
```text
/*  /index.html  200
```
*This tells Netlify to redirect all requests to index.html so Flutter can handle the routing internally.*

### Step 3: Build the Application
Run the build command optimized for web:
```bash
flutter build web --release --web-renderer canvaskit
```
*   `--web-renderer canvaskit`: Results in pixel-perfect rendering and better performance for complex layouts (like our specific Painter styles) but adds ~2MB to initial load.
*   `--web-renderer html`: Smaller download size, uses standard HTML elements, but might have minor visual discrepancies. **CanvasKit is recommended for this app.**

### Step 4: Deploying to Netlify

#### Option A: Drag and Drop (Manual)
1.  Locate the build output folder: `[project_root]/build/web`.
2.  Log in to [Netlify Drop](https://app.netlify.com/drop).
3.  Drag the entire `web` folder onto the drop zone.
4.  Netlify will upload and provide a live URL immediately.

#### Option B: Git Integration (CI/CD) - Recommended
1.  Push your Flutter code to GitHub/GitLab/Bitbucket.
2.  Log in to Netlify and click **"Add new site"** -> **"Import an existing project"**.
3.  Select your repository.
4.  **Build Settings**:
    *   **Base directory**: (leave empty)
    *   **Build command**: `if [ -d "flutter" ]; then flutter build web --release; else git clone https://github.com/flutter/flutter.git -b stable && ./flutter/bin/flutter build web --release; fi`
        *   *Note: Netlify doesn't have Flutter installed by default. This command clones Flutter and builds it.*
    *   **Publish directory**: `build/web`
5.  **Environment Variables**:
    *   Click "Show advanced" -> "New Variable".
    *   Key: `API_KEY` (Your Google GenAI Key).
    *   *In Flutter, you access this via `const String.fromEnvironment('API_KEY')`.*
6.  Click **Deploy Site**.

### Step 5: Handling API Keys in Flutter Web
Unlike Node.js, Flutter Web runs entirely on the client.
1.  **Do not** commit your API key to Git.
2.  Pass it during build time using `--dart-define`:
    ```bash
    flutter build web --dart-define=API_KEY=your_key_here
    ```
3.  Access it in Dart code:
    ```dart
    const apiKey = String.fromEnvironment('API_KEY');
    ```

## 5. Specific Flutter "Gotchas" for this App

1.  **CORS**: When making requests to Google AI from a browser (Flutter Web), you might encounter CORS issues if calling REST APIs manually. Using the official `google_generative_ai` package handles this gracefully.
2.  **File Pickers**: On Web, `file_picker` returns bytes (`Uint8List`). You must convert these bytes to Base64 or pass them directly to the `DataPart` constructor in the SDK.
3.  **PDF Rendering**: To show the *actual* PDF on the web alongside the summary, use the `syncfusion_flutter_pdfviewer` package or an IFrameElement via `dart:html` / `package:web`.

## 6. Summary

This Flutter transformation provides a robust, type-safe implementation of the FDA 510(k) Analyzer. By deploying to Netlify with the provided configuration, you ensure a high-availability hosting environment with automated CI/CD pipelines. The separation of concerns in the architecture allows for easy swapping of Gemini models (e.g., upgrading to Gemini 1.5 Pro when available) without rewriting UI logic.
