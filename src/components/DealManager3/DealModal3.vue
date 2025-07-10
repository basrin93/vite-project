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

        <!-- Поиск клиента -->
        <ClientSearch 
          v-model="clientData"
          :errors="{ inn: errors.buyerINN, name: errors.buyer }"
          @client-selected="onClientSelected"
          @client-cleared="onClientCleared"
          @create-client="onCreateClient"
        />
      </div>

      <div class="modal-footer">
        <button class="btn btn-secondary" @click="closeModal">Отменить</button>
        <button v-if="!hasExistingDeal" class="btn btn-primary" @click="createDeal">Создать сделку</button>
        <button v-if="hasExistingDeal" class="btn btn-primary" @click="saveDeal">Сохранить сделку</button>
        <button v-if="hasExistingDeal" class="btn btn-success" @click="confirmDeal">Подтвердить сделку</button>
      </div>
    </div>
  </div>
</template>

<script>
import ClientSearch from './ClientSearch3.vue'

export default {
  name: 'DealModal2',
  components: {
    ClientSearch
  },
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
        sourceDescription: ''
      },
      clientData: {
        inn: '7707083893',
        name: 'ООО "Рога и копыта"'
      },
      calculatedDelta: {
        rub: '300 000 ₽',
        percent: '16.67'
      },
      errors: {},
      selectedClient: null
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
      }
    },
    dealType() {
      this.clearErrors()
    }
  },
  methods: {
    loadExistingData() {
      if (this.hasExistingDeal && Object.keys(this.existingDealData).length > 0) {
        Object.assign(this.form, this.existingDealData)
        
        if (this.existingDealData.buyerINN || this.existingDealData.buyer) {
          this.clientData = {
            inn: this.existingDealData.buyerINN || '',
            name: this.existingDealData.buyer || ''
          }
        }
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
    
    onClientSelected(client) {
      this.selectedClient = client
      console.log('Клиент выбран:', client)
    },
    
    onClientCleared() {
      this.selectedClient = null
      console.log('Клиент очищен')
    },
    
    onCreateClient(data) {
      console.log('Создать нового клиента с ИНН:', data.inn)
      alert('Функция создания нового клиента будет реализована позже')
    },
    
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
      
      if (!this.clientData.inn) {
        this.errors.buyerINN = 'Поле обязательно для заполнения'
      }
      
      if (!this.clientData.name) {
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
          buyerINN: this.clientData.inn,
          buyer: this.clientData.name,
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
          buyerINN: this.clientData.inn,
          buyer: this.clientData.name,
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
          buyerINN: this.clientData.inn,
          buyer: this.clientData.name,
          selectedClient: this.selectedClient
        }
        this.$emit('confirm-deal', dealData)
        this.closeModal()
      }
    },
    
    closeModal() {
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

.form-group input:disabled {
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

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
  }
  
  .modal-content {
    width: 95%;
    margin: 20px;
  }
}
</style>