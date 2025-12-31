# Banana my food socials 🍌🍕

**Banana my food socials** is an AI-powered marketing assistant designed specifically for food brands. It takes raw food photography and brand details to generate high-end, captivating Facebook hero images and engaging post copy.

It leverages Google's **Gemini 2.5 Flash** models to provide a completely free-tier compatible experience without sacrificing quality.

## ✨ Features

- **🧬 Deep Brand DNA Research**: Analyzes your brand description, website URL, logo, and source food images to extract visual style, tone of voice, and key themes.
- **📸 Image Capture & Analysis**: Upload existing photos or capture fresh food shots directly from your device.
- **🧠 Creative Direction**: automatically generates 3 distinct creative concepts (marketing angles) based on your brand identity and specific food item.
- **🎨 AI Image Generation**: Creates photorealistic 16:9 Hero images using `gemini-2.5-flash-image`, tailored to the selected creative concept.
- **✍️ Copywriting**: Writes engaging Facebook post content, including headlines, body copy, and hashtags that match your brand's voice.
- **🖼️ Auto-Compositing**: Automatically overlays your brand logo and a stylized Call-to-Action (CTA) button onto the generated image for a ready-to-download marketing asset.
- **💸 Free Tier Optimized**: Built entirely using Gemini 1.5/2.5 Flash models to ensure low latency and zero cost on the free tier.

## 🚀 Getting Started

### Prerequisites

1.  **Node.js**: Ensure you have Node.js installed (v18+ recommended).
2.  **Google Gemini API Key**: You need an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
    *   *Note: This app uses the paid-tier-capable API endpoints but works perfectly with the Free plan.*

### Installation

1.  **Clone the repository** (or download the files):
    ```bash
    git clone https://github.com/your-username/banana-my-food-socials.git
    cd banana-my-food-socials
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start the development server**:
    ```bash
    npm start
    # or if using Vite:
    npm run dev
    ```

### Configuration

The application requires a Google Gemini API Key. You have two options:

1.  **Environment Variable (Recommended for Dev)**: Create a `.env` file in the root directory:
    ```env
    API_KEY=your_google_api_key_here
    ```
2.  **In-App Selection**: If no environment variable is found, the app will prompt you to securely select/connect your API key via the Google AI Studio integration upon launch.

## 📖 How to Use

1.  **Define Brand DNA**:
    *   Enter a short description of your restaurant or food brand (e.g., "A gritty late-night burger joint").
    *   (Optional) Enter your website URL and upload a transparent PNG logo.
2.  **Add Food Source**:
    *   Upload a photo of your dish or take a picture using your device's camera.
3.  **Generate Concepts**:
    *   Click **"Generate Creative Concepts"**. The AI will analyze your Brand DNA and the specific food photo to propose 3 unique marketing angles.
4.  **Select & Polish**:
    *   Choose the concept you like best.
    *   The app will generate a high-definition Hero Image and matching Facebook post text.
5.  **Download**:
    *   Click **"Save Composite"** to download the final image with your logo and a CTA button baked in, ready for social media.

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **AI**: @google/genai SDK (Gemini 2.5 Flash & Flash Image)
- **Build**: Vite (recommended) or Parcel

## 📄 License

MIT License. Feel free to fork and modify for your own food adventures!
