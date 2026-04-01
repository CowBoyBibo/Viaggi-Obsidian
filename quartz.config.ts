import { QuartzConfig } from "./quartz/cfg"
import * as Plugin from "./quartz/plugins"

/**
 * Quartz 4 Configuration
 *
 * See https://quartz.jzhao.xyz/configuration for more information.
 */
const config: QuartzConfig = {
  configuration: {
    pageTitle: "Archive of my Journey",
    pageTitleSuffix: "",
    enableSPA: true,
    enablePopovers: true,
    analytics: {
      provider: "plausible",
    },
    locale: "it-IT",
    baseUrl: "https://cowboybibo.github.io/Viaggi-Obsidian/",
    ignorePatterns: ["private", "templates", ".obsidian"],
    defaultDateType: "modified",
    theme: {
      fontOrigin: "googleFonts",
      cdnCaching: true,
      typography: {
  	header: "Playfair Display", // Questo è per i titoli (molto elegante)
  	body: "Lora",              // Questo è per i testi lunghi (stile libro antico)
        code: "IBM Plex Mono",
      },
      colors: {
  lightMode: {
    light: "#fdf6e3",       // Sfondo (Carta pergamena chiara)
    lightgray: "#eee8d5",   // Bordi e linee (Seppia chiarissimo)
    gray: "#93a1a1",        // Testo secondario (Grigio caldo)
    darkgray: "#586e75",    // Testo principale (Carbone/Marrone scuro)
    dark: "#073642",        // Titoli (Petrolio scuro, molto leggibile)
    secondary: "#b58900",   // Link (Oro antico / Ocra)
    tertiary: "#cb4b16",    // Accento / Hover (Arancio bruciato)
    highlight: "rgba(181, 137, 0, 0.15)", // Evidenziatore
  },
  darkMode: {
    light: "#1e1c19",       // Sfondo (Legno scuro / Ebano)
    lightgray: "#3c342a",   // Bordi (Legno venato)
    gray: "#8c7d6b",        // Testo secondario (Corteccia)
    darkgray: "#d9c8b3",    // Testo principale (Panna sporco / Crema)
    dark: "#ece0d1",        // Titoli (Pergamena chiara)
    secondary: "#e6b450",   // Link (Ambra calda)
    tertiary: "#d2691e",    // Accento (Rame / Cioccolato)
    highlight: "rgba(230, 180, 80, 0.15)", // Evidenziatore
  },
}
        },
      },
    },
  },
  plugins: {
    transformers: [
      Plugin.FrontMatter(),
      Plugin.CreatedModifiedDate({
        priority: ["frontmatter", "git", "filesystem"],
      }),
      Plugin.SyntaxHighlighting({
        theme: {
          light: "github-light",
          dark: "github-dark",
        },
        keepBackground: false,
      }),
      Plugin.ObsidianFlavoredMarkdown({ enableInHtmlEmbed: false }),
      Plugin.GitHubFlavoredMarkdown(),
      Plugin.TableOfContents(),
      Plugin.CrawlLinks({ markdownLinkResolution: "shortest" }),
      Plugin.Description(),
      Plugin.Latex({ renderEngine: "katex" }),
    ],
    filters: [Plugin.RemoveDrafts()],
    emitters: [
      Plugin.AliasRedirects(),
      Plugin.ComponentResources(),
      Plugin.ContentPage(),
      Plugin.FolderPage(),
      Plugin.TagPage(),
      Plugin.ContentIndex({
        enableSiteMap: true,
        enableRSS: true,
      }),
      Plugin.Assets(),
      Plugin.Static(),
      Plugin.Favicon(),
      Plugin.NotFoundPage(),
      // Comment out CustomOgImages to speed up build time
      Plugin.CustomOgImages(),
    ],
  },
}

export default config
