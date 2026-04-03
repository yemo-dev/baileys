import fs from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

export const loadPlugins = async (pluginsDir) => {
  const entries = await fs.readdir(pluginsDir, { withFileTypes: true })
  const files = entries.filter((e) => e.isFile() && e.name.endsWith('.js')).map((e) => e.name).sort()
  const plugins = []

  for (const file of files) {
    const fullPath = path.join(pluginsDir, file)
    const mod = await import(pathToFileURL(fullPath).href)
    const plugin = mod.default
    if (!plugin?.name || !Array.isArray(plugin?.commands) || typeof plugin?.execute !== 'function') {
      continue
    }
    plugins.push(plugin)
  }

  return plugins
}
