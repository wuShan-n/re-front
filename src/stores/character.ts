import { defineStore } from 'pinia'
import { characterAPI } from '@/api/character'
import { Character, CharacterDetail, CharacterCreate, CharacterUpdate } from '@/types/character'

interface CharacterState {
    characters: Character[]
    currentCharacter: CharacterDetail | null
    myCharacters: Character[]
    loading: boolean
    total: number
}

export const useCharacterStore = defineStore('character', {
    state: (): CharacterState => ({
        characters: [],
        currentCharacter: null,
        myCharacters: [],
        loading: false,
        total: 0
    }),

    getters: {
        getCharacterById: (state) => (id: number) => {
            return state.characters.find(c => c.id === id)
        },

        publicCharacters: (state) => {
            return state.characters.filter(c => c.is_public)
        }
    },

    actions: {
        // 获取角色列表
        async fetchCharacters(params?: any) {
            this.loading = true
            try {
                const response = await characterAPI.getList(params)
                this.characters = response.items
                this.total = response.total
                return response
            } catch (error) {
                throw error
            } finally {
                this.loading = false
            }
        },

        // 获取我的角色
        async fetchMyCharacters() {
            this.loading = true
            try {
                const characters = await characterAPI.getMyCharacters()
                this.myCharacters = characters
                return characters
            } catch (error) {
                throw error
            } finally {
                this.loading = false
            }
        },

        // 获取角色详情
        async fetchCharacterDetail(id: number) {
            this.loading = true
            try {
                const character = await characterAPI.getDetail(id)
                this.currentCharacter = character
                return character
            } catch (error) {
                throw error
            } finally {
                this.loading = false
            }
        },

        // 创建角色
        async createCharacter(data: CharacterCreate) {
            try {
                const character = await characterAPI.create(data)
                this.myCharacters.push(character)
                return character
            } catch (error) {
                throw error
            }
        },

        // 更新角色
        async updateCharacter(id: number, data: CharacterUpdate) {
            try {
                const character = await characterAPI.update(id, data)
                // 更新本地状态
                const index = this.characters.findIndex(c => c.id === id)
                if (index !== -1) {
                    this.characters[index] = character
                }
                const myIndex = this.myCharacters.findIndex(c => c.id === id)
                if (myIndex !== -1) {
                    this.myCharacters[myIndex] = character
                }
                if (this.currentCharacter?.id === id) {
                    this.currentCharacter = character
                }
                return character
            } catch (error) {
                throw error
            }
        },

        // 删除角色
        async deleteCharacter(id: number) {
            try {
                await characterAPI.delete(id)
                // 从本地状态移除
                this.characters = this.characters.filter(c => c.id !== id)
                this.myCharacters = this.myCharacters.filter(c => c.id !== id)
                if (this.currentCharacter?.id === id) {
                    this.currentCharacter = null
                }
            } catch (error) {
                throw error
            }
        },

        // 切换可见性
        async toggleCharacterVisibility(id: number, isPublic: boolean) {
            try {
                const result = await characterAPI.toggleVisibility(id, isPublic)
                // 更新本地状态
                const character = this.characters.find(c => c.id === id)
                if (character) {
                    character.is_public = isPublic
                }
                const myCharacter = this.myCharacters.find(c => c.id === id)
                if (myCharacter) {
                    myCharacter.is_public = isPublic
                }
                if (this.currentCharacter?.id === id) {
                    this.currentCharacter.is_public = isPublic
                }
                return result
            } catch (error) {
                throw error
            }
        },

        // 清空状态
        clearState() {
            this.characters = []
            this.currentCharacter = null
            this.myCharacters = []
            this.loading = false
            this.total = 0
        }
    }
})