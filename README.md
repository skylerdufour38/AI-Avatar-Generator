# AI Avatar Generator

A browser-based example of an AI avatar generator workflow designed for GitHub Pages and GitHub Codespaces.

## Workflow

Upload Image
↓
Upload Audio
↓
Upload Mask (optional)
↓
Enter Motion Prompt
↓
Choose 1080p / 31 seconds / Realistic
↓
Generate Video
↓
Screen Preview MP4
↓
Download MP4

## Included features

- Image upload
- Audio upload
- Optional mask upload
- Motion prompt textarea
- Resolution, duration, and style selection
- Video preview panel
- Download link for rendered result
- Static site configuration for GitHub Pages
- Dev container setup for GitHub Codespaces

## Run locally

From the project root:

```bash
python3 -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Deploy to GitHub Pages

1. Push this repository to GitHub.
2. Open the repository settings.
3. Enable GitHub Pages.
4. Select the GitHub Actions workflow as the source.

The workflow in [.github/workflows/pages.yml](.github/workflows/pages.yml) will publish the static site automatically.

## Codespaces

The dev container configuration in [.devcontainer/devcontainer.json](.devcontainer/devcontainer.json) is set up for a JavaScript/Node environment with port forwarding for the local preview.

## Notes

This example is intentionally front-end focused and demonstrates the user flow and UI for an avatar-generation experience in a static web app. It can be connected to a real video-generation backend later.
