<template>
  <div class="client-search">
    <div class="form-row">
      <div class="form-group client-search-group">
        <label class="required">ИНН покупателя</label>
        <div class="search-container">
          <input 
            type="text" 
            v-model="inn" 
            placeholder="Введите ИНН (10 или 12 цифр)"
            :class="{ 'error': hasError, 'searching': isSearching }"
            @input="onInnInput"
            @blur="searchClient"
            maxlength="12"
            :disabled="isSearching"
          >
          <button 
            type="button" 
            class="search-btn"
            @click="searchClient"
            :disabled="isSearching || !inn"
          >
            <span v-if="!isSearching">🔍</span>
            <span v-else class="spinner">⏳</span>
          </button>
        </div>
        
        <span v-if="errorMessage" class="error-text">{{ errorMessage }}</span>
      </div>

      <div class="form-group">
        <label class="required">Покупатель</label>
        <input 
          type="text" 
          v-model="clientName" 
          placeholder="Название будет найдено автоматически"
          :class="{ 'error': hasNameError }"
          :readonly="clientFound"
          :disabled="isSearching"
        >
        <span v-if="nameErrorMessage" class="error-text">{{ nameErrorMessage }}</span>
      </div>
    </div>

    <!-- Простой лоудер на всю ширину -->
    <div v-if="isSearching" class="search-loader">
      <div class="loader-text">{{ currentSearchMessage }}</div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: searchProgress + '%' }"></div>
      </div>
      <div class="progress-info">
        <span>{{ Math.round(searchProgress) }}%</span>
        <span>{{ formatTime(searchElapsed) }}</span>
      </div>
    </div>

    <!-- Карточка найденного клиента -->
    <div v-if="foundClient && !clientFound" class="client-card" :class="foundClient.sourceType">
      <div class="client-header">
        <span class="client-status">{{ foundClient.statusText }}</span>
        <span class="client-source">{{ foundClient.sourceText }}</span>
      </div>
      
      <div class="client-info">
        <div class="client-name">{{ foundClient.name }}</div>
        <div class="client-details">
          <span>ИНН: {{ foundClient.inn }}</span>
          <span v-if="foundClient.kpp">КПП: {{ foundClient.kpp }}</span>
          <span v-if="foundClient.lastUpdate">Обновлено: {{ foundClient.lastUpdate }}</span>
        </div>
      </div>
      
      <div class="client-actions">
        <button type="button" class="btn-client-select" @click="selectClient">
          Выбрать этого клиента
        </button>
        <button type="button" class="btn-client-clear" @click="clearClient">
          Очистить
        </button>
      </div>
    </div>

    <!-- Блок "Клиент не найден" -->
    <div v-if="showNotFound && !showCreateForm" class="client-not-found">
      <div class="not-found-header">
        <span class="not-found-icon">❌</span>
        <span class="not-found-text">Клиент не найден</span>
      </div>
      
      <div class="not-found-actions">
        <button type="button" class="btn-create-client" @click="createNewClient">
          🆕 Создать нового клиента
        </button>
      </div>
    </div>

    <!-- Форма создания нового клиента -->
    <div v-if="showCreateForm" class="create-client-form">
      <div class="create-form-header">
        <h3>Создание нового клиента</h3>
        <button type="button" class="btn-cancel-create" @click="cancelCreateClient">
          ✕ Отмена
        </button>
      </div>
      
      <div class="form-fields">
        <!-- Основная информация -->
        <div class="form-section">
          <h4>Основная информация</h4>
          
          <div class="form-group">
            <label for="fullName">Полное наименование:</label>
            <input 
              type="text" 
              id="fullName" 
              v-model="newClientForm.fullName"
              :class="{ 'error': formErrors.fullName }"
              placeholder="Общество с ограниченной ответственностью «Рога и копыта»"
            />
            <span v-if="formErrors.fullName" class="error-text">{{ formErrors.fullName }}</span>
          </div>
          
          <div class="form-group">
            <label for="shortName">Краткое наименование:</label>
            <input 
              type="text" 
              id="shortName" 
              v-model="newClientForm.shortName"
              :class="{ 'error': formErrors.shortName }"
              placeholder="Рога и копыта"
            />
            <span v-if="formErrors.shortName" class="error-text">{{ formErrors.shortName }}</span>
          </div>
          
          <div class="form-group">
            <label for="fullWithOpf">Полное наименование с ОПФ:</label>
            <input 
              type="text" 
              id="fullWithOpf" 
              v-model="newClientForm.fullWithOpf"
              :class="{ 'error': formErrors.fullWithOpf }"
              placeholder="ООО «Рога и копыта»"
            />
          </div>
          
          <div class="form-group">
            <label for="shortWithOpf">Краткое наименование с ОПФ:</label>
            <input 
              type="text" 
              id="shortWithOpf" 
              v-model="newClientForm.shortWithOpf"
              :class="{ 'error': formErrors.shortWithOpf }"
              placeholder="ООО «Рога и копыта»"
            />
          </div>
        </div>

        <!-- Реквизиты -->
        <div class="form-section">
          <h4>Реквизиты</h4>
          
          <div class="form-row">
            <div class="form-group">
              <label for="inn">ИНН:</label>
              <input 
                type="text" 
                id="inn" 
                v-model="newClientForm.inn"
                :class="{ 'error': formErrors.inn }"
                placeholder="7707083893"
                readonly
              />
              <span v-if="formErrors.inn" class="error-text">{{ formErrors.inn }}</span>
            </div>
            
            <div class="form-group">
              <label for="kpp">КПП:</label>
              <input 
                type="text" 
                id="kpp" 
                v-model="newClientForm.kpp"
                :class="{ 'error': formErrors.kpp }"
                placeholder="770701001"
              />
            </div>
          </div>
          
          <div class="form-group">
            <label for="ogrn">ОГРН:</label>
            <input 
              type="text" 
              id="ogrn" 
              v-model="newClientForm.ogrn"
              :class="{ 'error': formErrors.ogrn }"
              placeholder="1234567890123"
            />
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label for="organizationForm">Организационная форма:</label>
              <select 
                id="organizationForm" 
                v-model="newClientForm.organizationForm"
                :class="{ 'error': formErrors.organizationForm }"
              >
                <option value="">Выберите форму</option>
                <option value="ООО">ООО</option>
                <option value="АО">АО</option>
                <option value="ИП">ИП</option>
                <option value="ЗАО">ЗАО</option>
                <option value="ПАО">ПАО</option>
              </select>
            </div>
            
            <div class="form-group">
              <label for="clientType">Тип клиента:</label>
              <select 
                id="clientType" 
                v-model="newClientForm.clientType"
                :class="{ 'error': formErrors.clientType }"
              >
                <option value="">Выберите тип</option>
                <option value="Individual">Физическое лицо</option>
                <option value="Legal">Юридическое лицо</option>
              </select>
            </div>
          </div>
          
          <div class="form-group" v-if="newClientForm.clientType === 'Individual'">
            <label for="birthDate">Дата рождения:</label>
            <input 
              type="date" 
              id="birthDate" 
              v-model="newClientForm.birthDate"
              :class="{ 'error': formErrors.birthDate }"
            />
          </div>
        </div>

        <!-- Контактная информация -->
        <div class="form-section">
          <h4>Контактная информация</h4>
          
          <div class="form-group">
            <label for="mainPhone">Основной телефон:</label>
            <input 
              type="tel" 
              id="mainPhone" 
              v-model="newClientForm.mainPhone"
              :class="{ 'error': formErrors.mainPhone }"
              placeholder="+7 (999) 123-45-67"
            />
            <span v-if="formErrors.mainPhone" class="error-text">{{ formErrors.mainPhone }}</span>
          </div>
          
          <div class="form-group">
            <label>Дополнительные телефоны:</label>
            <div class="phone-list">
              <div 
                v-for="(phone, index) in newClientForm.phones" 
                :key="index"
                class="phone-item"
              >
                <input 
                  type="tel" 
                  v-model="newClientForm.phones[index]"
                  :placeholder="`Телефон ${index + 1}`"
                />
                <button 
                  type="button" 
                  class="btn-remove-phone" 
                  @click="removePhone(index)"
                  v-if="newClientForm.phones.length > 1"
                >
                  ✕
                </button>
              </div>
              <button type="button" class="btn-add-phone" @click="addPhone">
                + Добавить телефон
              </button>
            </div>
          </div>
          
          <div class="form-group">
            <label>Email адреса:</label>
            <div class="email-list">
              <div 
                v-for="(email, index) in newClientForm.emails" 
                :key="index"
                class="email-item"
              >
                <input 
                  type="email" 
                  v-model="newClientForm.emails[index]"
                  :placeholder="`Email ${index + 1}`"
                />
                <button 
                  type="button" 
                  class="btn-remove-email" 
                  @click="removeEmail(index)"
                  v-if="newClientForm.emails.length > 1"
                >
                  ✕
                </button>
              </div>
              <button type="button" class="btn-add-email" @click="addEmail">
                + Добавить email
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div class="form-actions">
        <button type="button" class="btn-save-client" @click="saveNewClient">
          💾 Сохранить клиента
        </button>
        <button type="button" class="btn-cancel" @click="cancelCreateClient">
          Отмена
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ClientSearch3',
  
  props: {
    modelValue: {
      type: Object,
      default: () => ({ inn: '', name: '' })
    },
    errors: {
      type: Object,
      default: () => ({})
    }
  },
  
  emits: ['update:modelValue', 'client-selected', 'client-cleared', 'create-client'],
  
  data() {
    return {
      inn: this.modelValue.inn || '',
      clientName: this.modelValue.name || '',
      
      isSearching: false,
      clientFound: false,
      foundClient: null,
      showNotFound: false,
      
      // Данные для лоудера
      searchProgress: 0,
      searchElapsed: 0,
      currentSearchMessage: '',
      searchTimer: null,
      
      // Новые данные для создания клиента
      showCreateForm: false,
      newClientForm: {
        fullName: '',
        shortName: '',
        fullWithOpf: '',
        shortWithOpf: '',
        birthDate: '',
        organizationForm: '',
        ogrn: '',
        inn: '',
        kpp: '',
        mainPhone: '',
        clientType: '',
        phones: [''],
        emails: ['']
      },
      createFormErrors: {},
      
      // Моковые данные для каскадного поиска
      mockClients: {
        localDB: [
          {
            inn: '7707083893',
            name: 'ООО "Рога и копыта"',
            kpp: '770701001',
            lastUpdate: '15.12.2024',
            source: 'local',
            verified: true
          },
          {
            inn: '1234567890',
            name: 'ИП Иванов Иван Иванович',
            lastUpdate: '10.12.2024',
            source: 'local',
            verified: true
          }
        ],
        spka: [
          {
            inn: '5555555555',
            name: 'ООО "Партнерская компания"',
            kpp: '555555001',
            uuid_spk: 'uuid-spka-12345',
            lastUpdate: '12.12.2024',
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
          }
        ]
      }
    }
  },
  
  computed: {
    hasError() {
      return this.errors.inn || this.errorMessage
    },
    
    hasNameError() {
      return this.errors.name || this.nameErrorMessage
    },
    
    errorMessage() {
      return this.errors.inn || ''
    },
    
    nameErrorMessage() {
      return this.errors.name || ''
    },
    
    formErrors() {
      return this.createFormErrors
    }
  },
  
  watch: {
    inn(newValue) {
      this.updateParent()
    },
    
    clientName(newValue) {
      this.updateParent()
    },
    
    'modelValue.inn'(newValue) {
      if (newValue !== this.inn) {
        this.inn = newValue
      }
    },
    
    'modelValue.name'(newValue) {
      if (newValue !== this.clientName) {
        this.clientName = newValue
      }
    }
  },
  
  methods: {
    updateParent() {
      this.$emit('update:modelValue', {
        inn: this.inn,
        name: this.clientName
      })
    },
    
    onInnInput() {
      this.foundClient = null
      this.clientFound = false
      this.showNotFound = false
      this.showCreateForm = false
      this.resetSearch()
      
      if (this.clientFound) {
        this.clientName = ''
      }
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
      return cleanInn.length === 10 || cleanInn.length === 12
    },
    
    async searchClient() {
      if (!this.inn.trim()) return
      
      if (!this.validateINN(this.inn)) {
        this.updateParent()
        return
      }
      
      this.isSearching = true
      this.foundClient = null
      this.clientFound = false
      this.showNotFound = false
      this.showCreateForm = false
      this.resetSearch()
      
      try {
        await this.cascadeSearch(this.inn)
      } catch (error) {
        console.error('Ошибка поиска:', error)
        this.showNotFound = true
      } finally {
        this.isSearching = false
        this.resetSearch()
      }
    },
    
    async cascadeSearch(inn) {
      const sources = [
        { name: 'local', text: 'Поиск в базе данных', data: this.mockClients.localDB, delay: 1000 },
        { name: 'spka', text: 'Поиск в СПКА', data: this.mockClients.spka, delay: 1500 },
        { name: 'dadata', text: 'Поиск в DaData', data: this.mockClients.dadata, delay: 3000 }
      ]
      
      for (const source of sources) {
        this.currentSearchMessage = source.text
        this.startProgressTimer(source.delay)
        
        // Имитация задержки
        await new Promise(resolve => setTimeout(resolve, source.delay))
        
        const client = source.data.find(c => c.inn === inn)
        
        if (client) {
          this.foundClient = this.formatClientData(client)
          return
        }
      }
      
      this.showNotFound = true
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
    
    formatClientData(client) {
      const sourceConfig = {
        local: {
          sourceType: 'local-source',
          statusText: '✅ Клиент найден',
          sourceText: '📊 Источник: Наша база данных'
        },
        spka: {
          sourceType: 'spka-source',
          statusText: '✅ Клиент найден',
          sourceText: '🤝 Источник: СПКА'
        },
        dadata: {
          sourceType: 'dadata-source',
          statusText: '✅ Клиент найден',
          sourceText: '🌐 Источник: DaData'
        }
      }
      
      return { ...client, ...sourceConfig[client.source] }
    },
    
    selectClient() {
      this.clientName = this.foundClient.name
      this.clientFound = true
      this.$emit('client-selected', this.foundClient)
      this.showConfetti()
    },
    
    clearClient() {
      this.foundClient = null
      this.clientFound = false
      this.clientName = ''
      this.$emit('client-cleared')
    },
    
    // Методы для создания клиента
    createNewClient() {
      this.showNotFound = false
      this.showCreateForm = true
      this.newClientForm.inn = this.inn
      this.createFormErrors = {}
    },
    
    cancelCreateClient() {
      this.showCreateForm = false
      this.showNotFound = true
      this.resetCreateForm()
    },
    
    resetCreateForm() {
      this.newClientForm = {
        fullName: '',
        shortName: '',
        fullWithOpf: '',
        shortWithOpf: '',
        birthDate: '',
        organizationForm: '',
        ogrn: '',
        inn: this.inn,
        kpp: '',
        mainPhone: '',
        clientType: '',
        phones: [''],
        emails: ['']
      }
      this.createFormErrors = {}
    },
    
    addPhone() {
      this.newClientForm.phones.push('')
    },
    
    removePhone(index) {
      if (this.newClientForm.phones.length > 1) {
        this.newClientForm.phones.splice(index, 1)
      }
    },
    
    addEmail() {
      this.newClientForm.emails.push('')
    },
    
    removeEmail(index) {
      if (this.newClientForm.emails.length > 1) {
        this.newClientForm.emails.splice(index, 1)
      }
    },
    
    validateCreateForm() {
      this.createFormErrors = {}
      
      if (!this.newClientForm.fullName.trim()) {
        this.createFormErrors.fullName = 'Полное наименование обязательно'
      }
      
      if (!this.newClientForm.shortName.trim()) {
        this.createFormErrors.shortName = 'Краткое наименование обязательно'
      }
      
      if (!this.newClientForm.inn.trim()) {
        this.createFormErrors.inn = 'ИНН обязателен'
      }
      
      if (!this.newClientForm.clientType) {
        this.createFormErrors.clientType = 'Тип клиента обязателен'
      }
      
      if (this.newClientForm.clientType === 'Individual' && !this.newClientForm.birthDate) {
        this.createFormErrors.birthDate = 'Дата рождения обязательна для физических лиц'
      }
      
      if (!this.newClientForm.mainPhone.trim()) {
        this.createFormErrors.mainPhone = 'Основной телефон обязателен'
      }
      
      return Object.keys(this.createFormErrors).length === 0
    },
    
    async saveNewClient() {
      if (!this.validateCreateForm()) {
        return
      }
      
      const cleanedData = {
        ...this.newClientForm,
        phones: this.newClientForm.phones.filter(phone => phone.trim()),
        emails: this.newClientForm.emails.filter(email => email.trim()),
        createdAt: new Date().toISOString(),
        changedAt: new Date().toISOString()
      }
      
      try {
        console.log('Создание клиента:', cleanedData)
        
        // Имитация API запроса
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        // После успешного создания
        this.foundClient = {
          ...cleanedData,
          name: cleanedData.fullName,
          source: 'local',
          sourceType: 'local-source',
          statusText: '✅ Клиент создан',
          sourceText: '📊 Источник: Создан в системе',
          lastUpdate: new Date().toLocaleDateString('ru-RU')
        }
        
        this.clientName = this.foundClient.name
        this.clientFound = true
        this.showCreateForm = false
        
        this.$emit('client-selected', this.foundClient)
        this.showSuccessMessage('Клиент успешно создан!')
        
      } catch (error) {
        console.error('Ошибка создания клиента:', error)
        alert('Ошибка при создании клиента. Попробуйте снова.')
      }
    },
    
    showSuccessMessage(message) {
      const notification = document.createElement('div')
      notification.className = 'success-notification'
      notification.textContent = message
      notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 12px 20px;
        border-radius: 4px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
      `
      
      document.body.appendChild(notification)
      
      setTimeout(() => {
        notification.remove()
      }, 3000)
    },
    
    showConfetti() {
      const button = document.querySelector('.btn-client-select')
      if (button) {
        button.textContent = '🎉 Выбрано!'
        setTimeout(() => {
          button.textContent = 'Выбрать этого клиента'
        }, 1500)
      }
    }
  }
}
</script>

<style scoped>
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
  box-sizing: border-box;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group input:disabled {
  background-color: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

.form-group input.error,
.form-group select.error {
  border-color: #ef4444;
  box-shadow: 0 0 0 2px rgba(244, 67, 54, 0.2);
}

.error-text {
  color: #ef4444;
  font-size: 12px;
  margin-top: 4px;
}

.client-search-group {
  position: relative;
}

.search-container {
  position: relative;
  display: flex;
  align-items: center;
}

.search-container input {
  flex: 1;
  padding-right: 45px;
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
  padding: 4px;
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

.search-loader {
  margin: 16px 0;
  padding: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.loader-text {
  text-align: center;
  color: #64748b;
  font-size: 14px;
  margin-bottom: 12px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: #e2e8f0;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #3b82f6, #06b6d4);
  transition: width 0.1s ease;
  border-radius: 3px;
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #64748b;
}

.client-card {
  margin-top: 16px;
  padding: 16px;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  background: white;
  animation: slideIn 0.3s ease-out;
}

.client-card.local-source {
  border-color: #10b981;
  background: #f0fdf4;
}

.client-card.spka-source {
  border-color: #3b82f6;
  background: #eff6ff;
}

.client-card.dadata-source {
  border-color: #f59e0b;
  background: #fffbeb;
}

.client-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.client-status {
  font-weight: 600;
  color: #059669;
}

.client-source {
  font-size: 12px;
  color: #6b7280;
}

.client-info {
  margin-bottom: 16px;
}

.client-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 16px;
  margin-bottom: 8px;
}

.client-details {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #6b7280;
  flex-wrap: wrap;
}

.client-actions {
  display: flex;
  gap: 12px;
}

.btn-client-select {
  padding: 8px 16px;
  background: #059669;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-client-select:hover {
  background: #047857;
}

.btn-client-clear {
  padding: 8px 12px;
  background: #f3f4f6;
  color: #374151;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-client-clear:hover {
  background: #e5e7eb;
}

.client-not-found {
  margin-top: 16px;
  padding: 16px;
  background: #fef2f2;
  border: 2px solid #fca5a5;
  border-radius: 8px;
  text-align: center;
  animation: slideIn 0.3s ease-out;
}

.not-found-header {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
}

.not-found-icon {
  font-size: 18px;
}

.not-found-text {
  font-weight: 600;
  color: #dc2626;
}

.not-found-actions {
  display: flex;
  justify-content: center;
}

.btn-create-client {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: #3b82f6;
  color: white;
}

.btn-create-client:hover {
  background: #2563eb;
}

/* Стили для формы создания клиента */
.create-client-form {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  background: #fafafa;
  margin-top: 16px;
  animation: slideIn 0.3s ease-out;
}

.create-form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e0e0e0;
}

.create-form-header h3 {
  margin: 0;
  color: #333;
}

.btn-cancel-create {
  background: #f44336;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-cancel-create:hover {
  background: #d32f2f;
}

.form-section {
  margin-bottom: 25px;
  padding: 15px;
  background: white;
  border-radius: 6px;
  border: 1px solid #e8e8e8;
}

.form-section h4 {
  margin: 0 0 15px 0;
  color: #555;
  font-size: 16px;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 8px;
}

.phone-list,
.email-list {
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  padding: 10px;
  background: #fafafa;
}

.phone-item,
.email-item {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
  align-items: center;
}

.phone-item:last-of-type,
.email-item:last-of-type {
  margin-bottom: 0;
}

.phone-item input,
.email-item input {
  flex: 1;
  margin: 0;
}

.btn-remove-phone,
.btn-remove-email {
  background: #f44336;
  color: white;
  border: none;
  padding: 4px 8px;
  border-radius: 3px;
  cursor: pointer;
  font-size: 12px;
  min-width: 24px;
}

.btn-remove-phone:hover,
.btn-remove-email:hover {
  background: #d32f2f;
}

.btn-add-phone,
.btn-add-email {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 6px 12px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  margin-top: 8px;
}

.btn-add-phone:hover,
.btn-add-email:hover {
  background: #45a049;
}

.form-actions {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #e0e0e0;
}

.btn-save-client {
  background: #4CAF50;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
}

.btn-save-client:hover {
  background: #45a049;
}

.btn-cancel {
  background: #757575;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

.btn-cancel:hover {
  background: #616161;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .client-details {
    flex-direction: column;
    gap: 4px;
  }
  
  .client-actions {
    flex-direction: column;
  }
}
</style>
