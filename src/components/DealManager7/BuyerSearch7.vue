<template>
  <div class="buyer-search-overlay" @click="cancelSearch">
    <div class="buyer-search-modal" @click.stop>
      <div class="search-header">
        <h4>Поиск покупателя</h4>
        <button 
          type="button" 
          class="btn-close-search"
          @click="cancelSearch"
        >
          ×
        </button>
      </div>

      <div class="search-form">
        <div class="search-input-group">
          <label class="required">ИНН покупателя</label>
          <div class="search-container">
            <input 
              type="text" 
              v-model="searchINN" 
              placeholder="Введите ИНН (10 или 12 цифр)"
              :class="{ 'error': hasError, 'searching': isSearching }"
              @input="onInnInput"
              @keyup.enter="searchBuyer"
              maxlength="12"
              :disabled="isSearching"
              ref="searchInput"
            >
            <button 
              type="button" 
              class="search-btn"
              @click="searchBuyer"
              :disabled="isSearching || !searchINN"
            >
              <span v-if="!isSearching">🔍</span>
              <span v-else class="spinner">⏳</span>
            </button>
          </div>
          <span v-if="errorMessage" class="error-text">{{ errorMessage }}</span>
        </div>

        <!-- Дрифтующая машинка в модальном окне -->
        <div v-if="isSearching" class="modal-car-loader">
          <div class="car-container">
            <div class="car">
              <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Capa_1" x="0px" y="0px" viewBox="0 0 512 512" style="enable-background:new 0 0 512 512;" xml:space="preserve">
                <g>
                  <path style="fill:#E38100;" d="M326.62,370.719l77.178-30.896c6.691-2.675,11.087-9.154,11.096-16.366V300.1l-88.274,35.31V370.719z"/>
                  <path style="fill:#E38100;" d="M185.381,370.719v-35.31L97.106,300.1v23.357c0.009,7.212,4.405,13.691,11.096,16.366L185.381,370.719z"/>
                </g>
                <path style="fill:#FFBC05;" d="M190.898,491.902l30.331,12.994c22.21,9.472,47.333,9.472,69.543,0l30.331-12.95c34.886-14.839,56.328-50.378,53.185-88.16l-12.358-147.824l12.694-151.699c2.966-35.875-16.251-69.94-48.498-85.944l-6.965-3.469c-39.776-19.8-86.544-19.8-126.321,0l-6.965,3.469c-32.247,16.004-51.464,50.069-48.498,85.944l12.694,151.699l-12.358,147.86C134.605,441.577,156.038,477.072,190.898,491.902z"/>
                <path style="fill:#E38100;" d="M138.33,396.23c49.672,65.508,133.921,94.63,213.439,73.771c-8.518,9.428-18.979,16.905-30.667,21.901l-30.331,12.994c-22.21,9.472-47.333,9.472-69.543,0l-30.331-12.95c-34.886-14.839-56.328-50.378-53.185-88.16L138.33,396.23z"/>
                <path style="fill:#23AEC8;" d="M324.36,368.795l2.26-1.474c5.455-3.619,8.457-9.957,7.803-16.472l-7.803-77.337H185.381l-7.768,77.337c-0.662,6.506,2.33,12.844,7.768,16.472l2.225,1.474C229.032,396.319,282.924,396.319,324.36,368.795z"/>
                <path style="fill:#1967A3;" d="M323.027,369.607c-41.277,26.668-94.436,26.35-135.386-0.812l-2.26-1.474c-5.455-3.619-8.457-9.957-7.803-16.472l5.941-59.144C217.389,335.674,267.82,363.834,323.027,369.607z"/>
                <path style="fill:#23AEC8;" d="M326.62,150.033H185.381l-6.779-40.677c-1.227-7.362,2.304-14.707,8.827-18.335l17.116-9.507c31.991-17.778,70.902-17.778,102.893,0l17.116,9.507c6.523,3.628,10.054,10.972,8.827,18.335L326.62,150.033z"/>
                <path style="fill:#1967A3;" d="M187.437,91.022l8.624-4.793c34.692,30.605,76.19,52.479,121.042,63.805H185.381l-6.779-40.677C177.365,101.994,180.905,94.65,187.437,91.022z"/>
                <g>
                  <rect x="285.98" y="423.671" transform="matrix(-0.5547 0.8321 -0.8321 -0.5547 853.9575 407.9586)" style="fill:#555160;" width="63.657" height="17.656"/>
                  <rect x="185.38" y="400.698" transform="matrix(-0.8321 0.5547 -0.5547 -0.8321 595.7145 684.6945)" style="fill:#555160;" width="17.656" height="63.657"/>
                </g>
              </svg>
            </div>
          </div>
          
          <div class="search-info">
            <div class="search-message">{{ currentSearchMessage }}</div>
            <div class="progress-container">
              <div class="progress-bar">
                <div class="progress-fill" :style="{ width: searchProgress + '%' }"></div>
              </div>
              <div class="progress-text">
                <span>{{ Math.round(searchProgress) }}%</span>
                <span>{{ formatTime(searchElapsed) }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Результаты поиска -->
        <div v-if="searchResults.length > 0" class="search-results">
          <h5>Результаты поиска:</h5>
          <div 
            v-for="(result, index) in searchResults" 
            :key="index"
            class="search-result-item"
            :class="result.sourceType"
            @click="selectBuyer(result)"
          >
            <div class="result-header">
              <span class="result-status">{{ result.statusText }}</span>
              <span class="result-source">{{ result.sourceText }}</span>
            </div>
            
            <div class="result-info">
              <div class="result-name">{{ result.name }}</div>
              <div class="result-details">
                <span>ИНН: {{ result.inn }}</span>
                <span v-if="result.kpp">КПП: {{ result.kpp }}</span>
                <span v-if="result.lastUpdate">Обновлено: {{ result.lastUpdate }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Сообщение "Не найдено" -->
        <div v-if="showNotFound" class="search-not-found">
          <div class="not-found-header">
            <span class="not-found-icon">❌</span>
            <span class="not-found-text">Покупатель не найден</span>
          </div>
          <div class="not-found-message">
            Покупатель с ИНН {{ searchINN }} не найден в СПКА и DaData
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'BuyerSearch6',
  
  emits: ['buyer-found', 'search-cancelled'],
  
  data() {
    return {
      searchINN: '',
      isSearching: false,
      searchResults: [],
      showNotFound: false,
      errorMessage: '',
      
      // Прогресс поиска
      searchProgress: 0,
      searchElapsed: 0,
      currentSearchMessage: '',
      searchTimer: null,
      
      // Моковые данные только для СПКА и DaData
      mockBuyers: {
        spka: [
          {
            inn: '5555555555',
            name: 'ООО "Партнерская компания"',
            kpp: '555555001',
            uuid_spk: 'uuid-spka-12345',
            lastUpdate: '12.12.2024',
            source: 'spka',
            verified: true
          },
          {
            inn: '1111111111',
            name: 'ООО "СПКА Компания"',
            kpp: '111111001',
            uuid_spk: 'uuid-spka-67890',
            lastUpdate: '10.12.2024',
            source: 'spka',
            verified: true
          }
        ],
        dadata: [
          {
            inn: '9999999999',
            name: 'ООО "Внешняя компания"',
            kpp: '999999001',
            source: 'dadata',
            verified: false
          },
          {
            inn: '8888888888',
            name: 'ИП Петров Петр Петрович',
            source: 'dadata',
            verified: false
          }
        ]
      }
    }
  },
  
  computed: {
    hasError() {
      return !!this.errorMessage
    }
  },
  
  mounted() {
    // Автофокус на поле ввода при открытии
    this.$nextTick(() => {
      if (this.$refs.searchInput) {
        this.$refs.searchInput.focus()
      }
    })
  },
  
  beforeUnmount() {
    if (this.searchTimer) {
      clearInterval(this.searchTimer)
    }
  },
  
  methods: {
    onInnInput() {
      this.searchResults = []
      this.showNotFound = false
      this.errorMessage = ''
      this.resetSearch()
    },
    
    resetSearch() {
      this.searchProgress = 0
      this.searchElapsed = 0
      this.currentSearchMessage = ''
      if (this.searchTimer) {
        clearInterval(this.searchTimer)
        this.searchTimer = null
      }
    },
    
    validateINN(inn) {
      const cleanInn = inn.replace(/\D/g, '')
      if (cleanInn.length !== 10 && cleanInn.length !== 12) {
        return false
      }
      return true
    },
    
    async searchBuyer() {
      if (!this.searchINN.trim()) {
        this.errorMessage = 'Введите ИНН'
        return
      }
      
      if (!this.validateINN(this.searchINN)) {
        this.errorMessage = 'ИНН должен содержать 10 или 12 цифр'
        return
      }
      
      this.isSearching = true
      this.searchResults = []
      this.showNotFound = false
      this.errorMessage = ''
      this.resetSearch()
      
      try {
        await this.performSearch(this.searchINN)
      } catch (error) {
        console.error('Ошибка поиска:', error)
        this.errorMessage = 'Произошла ошибка при поиске'
      } finally {
        this.isSearching = false
        this.resetSearch()
      }
    },
    
    async performSearch(inn) {
      const sources = [
        { 
          name: 'spka', 
          text: 'Поиск в СПКА...', 
          data: this.mockBuyers.spka, 
          delay: 2000 
        },
        { 
          name: 'dadata', 
          text: 'Поиск в DaData...', 
          data: this.mockBuyers.dadata, 
          delay: 3000 
        }
      ]
      
      for (const source of sources) {
        this.currentSearchMessage = source.text
        this.startProgressTimer(source.delay)
        
        // Имитация задержки
        await new Promise(resolve => setTimeout(resolve, source.delay))
        
        const buyers = source.data.filter(b => b.inn === inn)
        
        if (buyers.length > 0) {
          buyers.forEach(buyer => {
            this.searchResults.push(this.formatBuyerData(buyer))
          })
        }
      }
      
      if (this.searchResults.length === 0) {
        this.showNotFound = true
      }
    },
    
    startProgressTimer(totalDelay) {
      const startTime = Date.now()
      
      this.searchTimer = setInterval(() => {
        const elapsed = Date.now() - startTime
        const progress = Math.min((elapsed / totalDelay) * 100, 100)
        
        this.searchElapsed = elapsed
        this.searchProgress = progress
        
        if (progress >= 100) {
          clearInterval(this.searchTimer)
        }
      }, 100)
    },
    
    formatTime(ms) {
      const seconds = Math.floor(ms / 1000)
      const minutes = Math.floor(seconds / 60)
      const remainingSeconds = seconds % 60
      
      if (minutes > 0) {
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
      }
      return `${remainingSeconds}с`
    },
    
    formatBuyerData(buyer) {
      const sourceConfig = {
        spka: {
          sourceType: 'spka-source',
          statusText: '✅ Найден в СПКА',
          sourceText: '🤝 СПКА'
        },
        dadata: {
          sourceType: 'dadata-source',
          statusText: '✅ Найден в DaData',
          sourceText: '🌐 DaData'
        }
      }
      
      return { ...buyer, ...sourceConfig[buyer.source] }
    },
    
    selectBuyer(buyer) {
      this.$emit('buyer-found', buyer)
    },
    
    cancelSearch() {
      this.$emit('search-cancelled')
    }
  }
}
</script>

<style scoped>
.buyer-search-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1100;
  animation: fadeIn 0.3s ease-out;
}

.buyer-search-modal {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  animation: slideIn 0.3s ease-out;
}

.search-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
  background: #f8fafc;
  border-radius: 12px 12px 0 0;
}

.search-header h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #1f2937;
}

.btn-close-search {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 4px;
  border-radius: 4px;
  transition: background-color 0.2s;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close-search:hover {
  background: #e5e7eb;
}

.search-form {
  padding: 24px;
}

.search-input-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 16px;
}

.search-input-group label {
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
  font-size: 14px;
}

.search-input-group label.required::after {
  content: ' *';
  color: #ef4444;
}

.search-container {
  position: relative;
  display: flex;
  align-items: center;
}

.search-container input {
  flex: 1;
  padding: 12px 50px 12px 16px;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 0.2s;
}

.search-container input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-container input:disabled {
  background-color: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

.search-container input.error {
  border-color: #ef4444;
}

.search-container input.searching {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.search-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  padding: 8px;
  border-radius: 6px;
  transition: background-color 0.2s;
}

.search-btn:hover:not(:disabled) {
  background-color: #f3f4f6;
}

.search-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.spinner {
  animation: spin 1s linear infinite;
}

.error-text {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
}

/* Дрифтующая машинка в модальном окне */
.modal-car-loader {
  margin: 20px 0;
  padding: 20px;
  background: linear-gradient(135deg, #666, #444);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.modal-car-loader::before,
.modal-car-loader::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  animation: tracks 8s linear infinite;
}

.modal-car-loader::before {
  width: 150px;
  height: 150px;
  border: 6px solid rgba(255, 255, 255, 0.2);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.modal-car-loader::after {
  width: 80px;
  height: 80px;
  border: 4px solid rgba(255, 255, 255, 0.1);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.car-container {
  position: relative;
  z-index: 10;
  margin-bottom: 20px;
}

.car {
  position: relative;
  animation: drift 2.5s linear infinite;
}

.car::before,
.car::after {
  content: '';
  position: absolute;
  top: 5px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.8);
}

.car::before {
  animation: smoke 0.8s linear infinite;
}

.car::after {
  animation: smoke 0.8s linear 0.4s infinite;
}

.car svg {
  width: 80px;
  height: auto;
}

.search-info {
  text-align: center;
  z-index: 10;
  position: relative;
}

.search-message {
  color: white;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
}

.progress-container {
  width: 100%;
  max-width: 300px;
}

.progress-bar {
  width: 100%;
  height: 8px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  display: flex;
  justify-content: space-between;
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  font-weight: 500;
}

/* Анимации для дрифтующей машинки */
@keyframes smoke {
  from {
    left: 35px;
    width: 0px;
    height: 0px;
    opacity: 1;
  }
  to {
    left: 10px;
    width: 20px;
    height: 20px;
    opacity: 0;
  }
}

@keyframes drift {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes tracks {
  from {
    border-color: rgba(255, 255, 255, 0);
  }
  to {
    border-color: rgba(255, 255, 255, 0.3);
  }
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Результаты поиска */
.search-results {
  margin-top: 16px;
}

.search-results h5 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 600;
  color: #1f2937;
}

.search-result-item {
  padding: 12px;
  margin-bottom: 8px;
  border-radius: 6px;
  border: 2px solid;
  cursor: pointer;
  transition: all 0.2s;
}

.search-result-item:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.search-result-item.spka-source {
  border-color: #3b82f6;
  background: #eff6ff;
}

.search-result-item.spka-source:hover {
  background: #dbeafe;
}

.search-result-item.dadata-source {
  border-color: #f59e0b;
  background: #fffbeb;
}

.search-result-item.dadata-source:hover {
  background: #fef3c7;
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.result-status {
  font-weight: 600;
  color: #059669;
  font-size: 12px;
}

.result-source {
  font-size: 11px;
  color: #6b7280;
  font-weight: 500;
}

.result-info {
  margin-bottom: 8px;
}

.result-name {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 4px;
  color: #1f2937;
}

.result-details {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #6b7280;
}

.search-not-found {
  margin-top: 16px;
  padding: 16px;
  background: #fef2f2;
  border: 2px solid #fca5a5;
  border-radius: 6px;
  text-align: center;
}

.not-found-header {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.not-found-icon {
  font-size: 16px;
}

.not-found-text {
  font-weight: 600;
  color: #dc2626;
  font-size: 14px;
}

.not-found-message {
  font-size: 12px;
  color: #6b7280;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@media (max-width: 768px) {
  .buyer-search-modal {
    width: 95%;
    margin: 20px;
  }
  
  .result-details {
    flex-direction: column;
    gap: 4px;
  }
  
  .modal-car-loader {
    min-height: 150px;
  }
  
  .car svg {
    width: 60px;
  }
}
</style>