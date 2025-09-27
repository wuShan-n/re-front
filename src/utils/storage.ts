class StorageService {
    private prefix: string = 'roleplay_'

    setItem(key: string, value: any): void {
        const fullKey = this.prefix + key
        const data = JSON.stringify(value)
        localStorage.setItem(fullKey, data)
    }

    getItem<T = any>(key: string): T | null {
        const fullKey = this.prefix + key
        const data = localStorage.getItem(fullKey)
        if (data) {
            try {
                return JSON.parse(data) as T
            } catch {
                return null
            }
        }
        return null
    }

    removeItem(key: string): void {
        const fullKey = this.prefix + key
        localStorage.removeItem(fullKey)
    }

    clear(): void {
        const keys = Object.keys(localStorage)
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                localStorage.removeItem(key)
            }
        })
    }
}

export default new StorageService()