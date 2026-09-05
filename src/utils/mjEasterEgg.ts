const moonwalkEventName = 'xuelinjie:moonwalk'

export function triggerMoonwalkEasterEgg(query: string) {
  if (query.trim().toLowerCase() !== 'mj') return false

  window.dispatchEvent(new Event(moonwalkEventName))
  return true
}

export { moonwalkEventName }
