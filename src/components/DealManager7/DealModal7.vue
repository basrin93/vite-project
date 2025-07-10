<template>
  <div class="modal-overlay" v-if="isOpen" @click="closeModal">
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <h2>Данные о реализации ({{ dealTypeText }})</h2>
        <button class="close-button" @click="closeModal">×</button>
      </div>

      <div class="modal-body">
        <div class="form-row">
          <div class="form-group">
            <label class="required">Дата реализации</label>
            <input 
              type="date" 
              v-model="form.realizationDate" 
              :class="{ 'error': errors.realizationDate }"
            >
            <span v-if="errors.realizationDate" class="error-text">{{ errors.realizationDate }}</span>
          </div>

          <div class="form-group">
            <label class="required">Цена реализации</label>
            <input 
              type="number" 
              v-model="form.realizationPrice" 
              @input="calculateDelta"
              :class="{ 'error': errors.realizationPrice }"
            >
            <span v-if="errors.realizationPrice" class="error-text">{{ errors.realizationPrice }}</span>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Дельта (руб.)</label>
            <input 
              type="text" 
              v-model="calculatedDelta.rub" 
              readonly
              class="calculated-field positive"
            >
          </div>

          <div class="form-group">
            <label>Дельта (%)</label>
            <input 
              type="text" 
              v-model="calculatedDelta.percent" 
              readonly
              class="calculated-field positive"
            >
          </div>
        </div>

        <!-- Поля для лизинга -->
        <template v-if="dealType === 'leasing'">
          <div class="form-row">
            <div class="form-group">
              <label class="required">Клиентский менеджер</label>
              <select 
                v-model="form.clientManager" 
                :class="{ 'error': errors.clientManager }"
              >
                <option value="">Выберите менеджера</option>
                <option value="ivanov">Иванов И.И. - Менеджер</option>
                <option value="petrov">Петров П.П. - Менеджер</option>
              </select>
              <span v-if="errors.clientManager" class="error-text">{{ errors.clientManager }}</span>
            </div>

            <div class="form-group">
              <label class="required">Руководитель группы</label>
              <select 
                v-model="form.groupManager" 
                :class="{ 'error': errors.groupManager }"
              >
                <option value="">Выберите руководителя</option>
                <option value="rukovoditel">Руководителя Р. Р. - Руководитель группы</option>
              </select>
              <span v-if="errors.groupManager" class="error-text">{{ errors.groupManager }}</span>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label class="required">Номер проекта</label>
              <input 
                type="text" 
                v-model="form.projectNumber" 
                placeholder="2024-001"
                :class="{ 'error': errors.projectNumber }"
              >
              <span v-if="errors.projectNumber" class="error-text">{{ errors.projectNumber }}</span>
            </div>

            <div class="form-group">
              <label class="required">Договор лизинга</label>
              <input 
                type="text" 
                v-model="form.leasingContract" 
                placeholder="КП-2024-001"
                :class="{ 'error': errors.leasingContract }"
              >
              <span v-if="errors.leasingContract" class="error-text">{{ errors.leasingContract }}</span>
            </div>
          </div>
        </template>

        <!-- Поля для денег -->
        <template v-if="dealType === 'sale'">
          <div class="form-row">
            <div class="form-group">
              <label>Инициатор продажи</label>
              <select v-model="form.saleInitiator">
                <option value="">Выберите инициатора</option>
                <option value="ivanov">Иванов И.И. - Менеджер</option>
                <option value="petrov">Петров П.П. - Менеджер</option>
              </select>
            </div>

            <div class="form-group">
              <label class="required">Договор КП</label>
              <input 
                type="text" 
                v-model="form.contractKP" 
                placeholder="КП-2024-001"
                :class="{ 'error': errors.contractKP }"
              >
              <span v-if="errors.contractKP" class="error-text">{{ errors.contractKP }}</span>
            </div>
          </div>
        </template>

        <div class="form-row">
          <div class="form-group">
            <label class="required">Источник</label>
            <select 
              v-model="form.source" 
              @change="onSourceChange"
              :class="{ 'error': errors.source }"
            >
              <option value="">Выберите источник</option>
              <option value="avito">Avito</option>
              <option value="auto_ru">Auto.ru</option>
              <option value="other">Иное</option>
            </select>
            <span v-if="errors.source" class="error-text">{{ errors.source }}</span>
          </div>

          <div class="form-group">
            <label :class="{ 'required': form.source === 'other' }">Пояснение к источнику</label>
            <input 
              type="text" 
              v-model="form.sourceDescription" 
              :placeholder="form.source === 'other' ? 'Обязательно для источника \'Иное\'' : 'Доступно только для источника \'Иное\''"
              :disabled="form.source !== 'other'"
              :class="{ 'error': errors.sourceDescription }"
            >
            <span v-if="errors.sourceDescription" class="error-text">{{ errors.sourceDescription }}</span>
          </div>
        </div>

        <!-- Поля покупателя -->
        <div class="form-row">
          <div class="form-group">
            <label class="required">ИНН покупателя</label>
            <input 
              type="text" 
              v-model="form.buyerINN" 
              placeholder="Введите ИНН"
              :class="{ 'error': errors.buyerINN }"
              :readonly="buyerDataLocked"
            >
            <span v-if="errors.buyerINN" class="error-text">{{ errors.buyerINN }}</span>
          </div>

          <div class="form-group">
            <label class="required">Покупатель</label>
            <input 
              type="text" 
              v-model="form.buyer" 
              placeholder="Название компании"
              :class="{ 'error': errors.buyer }"
              :readonly="buyerDataLocked"
            >
            <span v-if="errors.buyer" class="error-text">{{ errors.buyer }}</span>
          </div>
        </div>

        <!-- Встроенная секция поиска покупателя -->
        <div 
          v-if="showBuyerSearch" 
          class="buyer-search-section"
          :class="{ 'expanded': showBuyerSearch }"
        >
          <div class="search-header">
            <h4>Поиск покупателя в базах данных</h4>
          </div>

          <div class="search-form">
            <div class="search-input-group">
              <label class="required">ИНН для поиска</label>
              <div class="search-container">
                <input 
                  type="text" 
                  v-model="searchINN" 
                  placeholder="Введите ИНН (10 или 12 цифр)"
                  :class="{ 'error': searchError, 'searching': isSearching }"
                  @input="onSearchInnInput"
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
              <span v-if="searchErrorMessage" class="error-text">{{ searchErrorMessage }}</span>
            </div>

            <!-- Дрифтующая машинка -->
            <div v-if="isSearching" class="inline-car-loader">
              <div class="car-container">
                <div class="car">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="car-svg">
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
              <h5>Найденные покупатели:</h5>
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

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="closeModal">Отменить</button>
        <button 
          type="button"
          class="btn btn-search"
          @click="toggleBuyerSearch"
          :class="{ 'active': showBuyerSearch }"
        >
          🔍 {{ showBuyerSearch ? 'Скрыть поиск' : 'Поиск покупателя' }}
        </button>
        <button v-if="!hasExistingDeal" class="btn btn-primary" @click="createDeal">Создать сделку</button>
        <button v-if="hasExistingDeal" class="btn btn-primary" @click="saveDeal">Сохранить сделку</button>
        <button v-if="hasExistingDeal" class="btn btn-success" @click="confirmDeal">Подтвердить сделку</button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'DealModal6',
  props: {
    isOpen: {
      type: Boolean,
      default: true
    },
    dealType: {
      type: String,
      default: 'sale',
      validator: value => ['sale', 'leasing'].includes(value)
    },
    hasExistingDeal: {
      type: Boolean,
      default: false
    },
    actualCost: {
      type: Number,
      default: 1500000
    },
    existingDealData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      form: {
        realizationDate: '2024-12-15',
        realizationPrice: 1800000,
        clientManager: 'ivanov',
        groupManager: 'rukovoditel',
        projectNumber: '2024-001',
        leasingContract: 'КП-2024-001',
        saleInitiator: '',
        contractKP: 'КП-2024-001',
        source: 'avito',
        sourceDescription: '',
        buyerINN: '',
        buyer: ''
      },
      calculatedDelta: {
        rub: '300 000 ₽',
        percent: '16.67'
      },
      errors: {},
      selectedClient: null,
      buyerDataLocked: false,
      
      // Поиск покупателя
      showBuyerSearch: false,
      searchINN: '',
      isSearching: false,
      searchResults: [],
      showNotFound: false,
      searchError: false,
      searchErrorMessage: '',
      
      // Прогресс поиска
      searchProgress: 0,
      searchElapsed: 0,
      currentSearchMessage: '',
      searchTimer: null,
      
      // Моковые данные для поиска
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
    dealTypeText() {
      return this.dealType === 'leasing' ? 'Передан в лизинг' : 'Реализован в деньги'
    }
  },
  watch: {
    isOpen(newValue) {
      if (newValue) {
        this.loadExistingData()
        this.calculateDelta()
      } else {
        this.clearErrors()
        this.resetSearch()
      }
    },
    dealType() {
      this.clearErrors()
    },
    showBuyerSearch(newValue) {
      if (newValue) {
        this.$nextTick(() => {
          if (this.$refs.searchInput) {
            this.$refs.searchInput.focus()
          }
        })
      }
    }
  },
  beforeUnmount() {
    if (this.searchTimer) {
      clearInterval(this.searchTimer)
    }
  },
  methods: {
    loadExistingData() {
      if (this.hasExistingDeal && Object.keys(this.existingDealData).length > 0) {
        Object.assign(this.form, this.existingDealData)
      }
    },
    
    calculateDelta() {
      if (this.form.realizationPrice && this.actualCost) {
        const deltaRub = this.form.realizationPrice - this.actualCost
        const deltaPercent = ((deltaRub / this.form.realizationPrice) * 100).toFixed(2)
        
        this.calculatedDelta.rub = `${deltaRub.toLocaleString('ru-RU')} ₽`
        this.calculatedDelta.percent = deltaPercent
      }
    },
    
    onSourceChange() {
      if (this.form.source !== 'other') {
        this.form.sourceDescription = ''
      }
      this.validateField('sourceDescription')
    },
    
    // Методы поиска покупателя
    toggleBuyerSearch() {
      this.showBuyerSearch = !this.showBuyerSearch
      if (!this.showBuyerSearch) {
        this.resetSearchState()
      }
    },
    
    onSearchInnInput() {
      this.searchResults = []
      this.showNotFound = false
      this.searchError = false
      this.searchErrorMessage = ''
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
    
    resetSearchState() {
      this.searchINN = ''
      this.searchResults = []
      this.showNotFound = false
      this.searchError = false
      this.searchErrorMessage = ''
      this.resetSearch()
    },
    
    validateSearchINN(inn) {
      const cleanInn = inn.replace(/\D/g, '')
      return cleanInn.length === 10 || cleanInn.length === 12
    },
    
    async searchBuyer() {
      if (!this.searchINN.trim()) {
        this.searchErrorMessage = 'Введите ИНН'
        this.searchError = true
        return
      }
      
      if (!this.validateSearchINN(this.searchINN)) {
        this.searchErrorMessage = 'ИНН должен содержать 10 или 12 цифр'
        this.searchError = true
        return
      }
      
      this.isSearching = true
      this.searchResults = []
      this.showNotFound = false
      this.searchError = false
      this.searchErrorMessage = ''
      this.resetSearch()
      
      try {
        await this.performSearch(this.searchINN)
      } catch (error) {
        console.error('Ошибка поиска:', error)
        this.searchErrorMessage = 'Произошла ошибка при поиске'
        this.searchError = true
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
      this.form.buyerINN = buyer.inn
      this.form.buyer = buyer.name
      this.selectedClient = buyer
      this.buyerDataLocked = true
      
      // Скрыть поиск и очистить состояние
      this.showBuyerSearch = false
      this.resetSearchState()
      
      // Очистить ошибки
      this.validateField('buyerINN')
      this.validateField('buyer')
      
      console.log('Покупатель выбран:', buyer)
    },
    
    clearBuyerData() {
      this.form.buyerINN = ''
      this.form.buyer = ''
      this.buyerDataLocked = false
      this.selectedClient = null
      this.showBuyerSearch = false
      this.resetSearchState()
    },
    
    // Остальные методы формы
    validateForm() {
      this.errors = {}
      
      if (!this.form.realizationDate) {
        this.errors.realizationDate = 'Поле обязательно для заполнения'
      }
      
      if (!this.form.realizationPrice) {
        this.errors.realizationPrice = 'Поле обязательно для заполнения'
      }
      
      if (!this.form.source) {
        this.errors.source = 'Поле обязательно для заполнения'
      }
      
      if (this.form.source === 'other' && !this.form.sourceDescription) {
        this.errors.sourceDescription = 'Поле обязательно для источника "Иное"'
      }
      
      if (!this.form.buyerINN) {
        this.errors.buyerINN = 'Поле обязательно для заполнения'
      }
      
      if (!this.form.buyer) {
        this.errors.buyer = 'Поле обязательно для заполнения'
      }
      
      if (this.dealType === 'leasing') {
        if (!this.form.clientManager) {
          this.errors.clientManager = 'Поле обязательно для заполнения'
        }
        
        if (!this.form.groupManager) {
          this.errors.groupManager = 'Поле обязательно для заполнения'
        }
        
        if (!this.form.projectNumber) {
          this.errors.projectNumber = 'Поле обязательно для заполнения'
        }
        
        if (!this.form.leasingContract) {
          this.errors.leasingContract = 'Поле обязательно для заполнения'
        }
      }
      
      if (this.dealType === 'sale') {
        if (!this.form.contractKP) {
          this.errors.contractKP = 'Поле обязательно для заполнения'
        }
      }
      
      return Object.keys(this.errors).length === 0
    },
    
    validateField(fieldName) {
      if (this.errors[fieldName]) {
        delete this.errors[fieldName]
      }
    },
    
    clearErrors() {
      this.errors = {}
    },
    
    createDeal() {
      if (this.validateForm()) {
        const dealData = {
          ...this.form,
          selectedClient: this.selectedClient
        }
        this.$emit('create-deal', dealData)
        this.closeModal()
      }
    },
    
    saveDeal() {
      if (this.validateForm()) {
        const dealData = {
          ...this.form,
          selectedClient: this.selectedClient
        }
        this.$emit('save-deal', dealData)
        this.closeModal()
      }
    },
    
    confirmDeal() {
      if (this.validateForm()) {
        const dealData = {
          ...this.form,
          selectedClient: this.selectedClient
        }
        this.$emit('confirm-deal', dealData)
        this.closeModal()
      }
    },
    
    closeModal() {
      this.showBuyerSearch = false
      this.resetSearchState()
      this.buyerDataLocked = false
      this.$emit('close')
    }
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h2 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #1f2937;
}

.close-button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #6b7280;
  padding: 0;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
}

.close-button:hover {
  background: #f3f4f6;
}

.modal-body {
  padding: 24px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 16px;
}

.form-group {
  display: flex;
  flex-direction: column;
}

.form-group label {
  font-weight: 500;
  color: #374151;
  margin-bottom: 8px;
  font-size: 14px;
}

.form-group label.required::after {
  content: ' *';
  color: #ef4444;
}

.form-group input,
.form-group select {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group input:disabled,
.form-group input:readonly {
  background-color: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

.form-group input.error,
.form-group select.error {
  border-color: #ef4444;
}

.error-text {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
}

.calculated-field {
  background-color: #f9fafb;
  color: #059669;
  font-weight: 500;
}

.calculated-field.positive {
  color: #059669;
}

.calculated-field.negative {
  color: #dc2626;
}

/* Встроенная секция поиска */
.buyer-search-section {
  margin: 16px 0;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  overflow: hidden;
  animation: expandSection 0.3s ease-out;
}

.buyer-search-section.expanded {
  animation: expandSection 0.3s ease-out;
}

.search-header {
  padding: 16px 20px;
  background: #f1f5f9;
  border-bottom: 1px solid #e2e8f0;
}

.search-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.search-form {
  padding: 20px;
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
  padding: 10px 50px 10px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
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
  font-size: 16px;
  padding: 6px;
  border-radius: 4px;
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

/* Встроенный лоадер с машинкой */
.inline-car-loader {
  margin: 16px 0;
  padding: 20px;
  background: linear-gradient(135deg, #4b5563, #374151);
  border-radius: 8px;
  position: relative;
  overflow: hidden;
  min-height: 120px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
}

.inline-car-loader::before,
.inline-car-loader::after {
  content: '';
  position: absolute;
  border-radius: 50%;
  animation: tracks 6s linear infinite;
}

.inline-car-loader::before {
  width: 100px;
  height: 100px;
  border: 4px solid rgba(255, 255, 255, 0.2);
  top: 50%;
  left: 20%;
  transform: translate(-50%, -50%);
}

.inline-car-loader::after {
  width: 60px;
  height: 60px;
  border: 3px solid rgba(255, 255, 255, 0.1);
  top: 50%;
  left: 20%;
  transform: translate(-50%, -50%);
}

.car-container {
  position: relative;
  z-index: 10;
  flex-shrink: 0;
}

.car {
  position: relative;
  animation: drift 2s linear infinite;
}

.car::before,
.car::after {
  content: '';
  position: absolute;
  top: 2px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.7);
}

.car::before {
  animation: smoke 0.6s linear infinite;
}

.car::after {
  animation: smoke 0.6s linear 0.3s infinite;
}

.car-svg {
  width: 60px;
  height: auto;
}

.search-info {
  flex: 1;
  z-index: 10;
  position: relative;
  text-align: left;
}

.search-message {
  color: white;
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 12px;
}

.progress-container {
  width: 100%;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #8b5cf6);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  display: flex;
  justify-content: space-between;
  color: rgba(255, 255, 255, 0.9);
  font-size: 12px;
  font-weight: 500;
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

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid #e5e7eb;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

.btn-success {
  background: #059669;
  color: white;
}

.btn-success:hover {
  background: #047857;
}

.btn-search {
  background: #f59e0b;
  color: white;
}

.btn-search:hover {
  background: #d97706;
}

.btn-search.active {
  background: #dc2626;
}

.btn-search.active:hover {
  background: #b91c1c;
}

/* Анимации */
@keyframes expandSection {
  from {
    opacity: 0;
    max-height: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    max-height: 1000px;
    transform: translateY(0);
  }
}

@keyframes smoke {
  from {
    left: 25px;
    width: 0px;
    height: 0px;
    opacity: 1;
  }
  to {
    left: 10px;
    width: 15px;
    height: 15px;
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

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
  
  .result-details {
    flex-direction: column;
    gap: 4px;
  }
  
  .modal-footer {
    flex-wrap: wrap;
    gap: 8px;
  }
  
  .modal-footer .btn {
    flex: 1;
    min-width: 120px;
  }
  
  .inline-car-loader {
    flex-direction: column;
    min-height: 140px;
    text-align: center;
  }
  
  .search-info {
    text-align: center;
  }
}
</style>