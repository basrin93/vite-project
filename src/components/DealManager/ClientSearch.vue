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
        
        <!-- Индикаторы поиска -->
        <div v-if="searchProgress.length > 0" class="search-progress">
          <div 
            v-for="step in searchProgress" 
            :key="step.source"
            :class="['progress-step', step.status]"
          >
            <span class="step-icon">{{ step.icon }}</span>
            <span class="step-text">{{ step.text }}</span>
          </div>
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
        >
        <span v-if="nameErrorMessage" class="error-text">{{ nameErrorMessage }}</span>
      </div>
    </div>

    <!-- Карточка найденного клиента -->
    <div v-if="foundClient" class="client-card" :class="foundClient.sourceType">
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
    <div v-if="showNotFound" class="client-not-found">
      <div class="not-found-header">
        <span class="not-found-icon">❌</span>
        <span class="not-found-text">Клиент не найден</span>
      </div>
      
      <div class="not-found-actions">
        <button type="button" class="btn-create-client" @click="createNewClient">
          🆕 Создать нового клиента
        </button>
        <button type="button" class="btn-manual-input" @click="enableManualInput">
          📝 Заполнить вручную
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ClientSearch',
  
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
      searchProgress: [],
      
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
      this.searchProgress = []
      
      if (this.clientFound) {
        this.clientName = ''
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
      this.searchProgress = []
      
      try {
        await this.cascadeSearch(this.inn)
      } catch (error) {
        console.error('Ошибка поиска:', error)
        this.showNotFound = true
      } finally {
        this.isSearching = false
      }
    },
    
    async cascadeSearch(inn) {
      const sources = [
        { name: 'local', text: 'Поиск в базе данных', icon: '🔍', data: this.mockClients.localDB },
        { name: 'spka', text: 'Поиск в СПКА', icon: '🔍', data: this.mockClients.spka },
        { name: 'dadata', text: 'Поиск в DaData', icon: '🔍', data: this.mockClients.dadata }
      ]
      
      for (const source of sources) {
        this.searchProgress.push({
          source: source.name,
          text: source.text,
          icon: '⏳',
          status: 'searching'
        })
        
        await new Promise(resolve => setTimeout(resolve, 500))
        
        const client = source.data.find(c => c.inn === inn)
        
        if (client) {
          this.updateSearchProgress(source.name, '✅', 'found')
          this.foundClient = this.formatClientData(client)
          return
        } else {
          this.updateSearchProgress(source.name, '❌', 'not-found')
        }
      }
      
      this.showNotFound = true
    },
    
    updateSearchProgress(source, icon, status) {
      const step = this.searchProgress.find(s => s.source === source)
      if (step) {
        step.icon = icon
        step.status = status
      }
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
      this.searchProgress = []
      this.$emit('client-cleared')
    },
    
    createNewClient() {
      this.$emit('create-client', { inn: this.inn })
    },
    
    enableManualInput() {
      this.showNotFound = false
      this.foundClient = null
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

.form-group input {
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group input:disabled {
  background-color: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}

.form-group input.error {
  border-color: #ef4444;
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

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.search-progress {
  margin-top: 8px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 6px;
  border: 1px solid #e2e8f0;
}

.progress-step {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 14px;
}

.progress-step:last-child {
  margin-bottom: 0;
}

.progress-step.searching .step-icon {
  animation: pulse 1s infinite;
}

.progress-step.found .step-text {
  color: #059669;
  font-weight: 500;
}

.progress-step.not-found .step-text {
  color: #6b7280;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

.client-card {
  margin-top: 16px;
  padding: 16px;
  border-radius: 8px;
  border: 2px solid;
  animation: slideIn 0.3s ease-out;
}

.client-card.local-source {
  border-color: #059669;
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
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #1f2937;
}

.client-details {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #6b7280;
}

.client-actions {
  display: flex;
  gap: 8px;
}

.btn-client-select {
  flex: 1;
  padding: 8px 12px;
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
  gap: 8px;
  justify-content: center;
}

.btn-create-client,
.btn-manual-input {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-create-client {
  background: #3b82f6;
  color: white;
}

.btn-create-client:hover {
  background: #2563eb;
}

.btn-manual-input {
  background: #f3f4f6;
  color: #374151;
}

.btn-manual-input:hover {
  background: #e5e7eb;
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
  
  .not-found-actions {
    flex-direction: column;
  }
}
</style>