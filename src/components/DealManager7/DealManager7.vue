<template>
  <div class="deal-manager">
    <h1>Модальное окно сделки</h1>
    
    <div class="deal-buttons">
      <button @click="openModal('sale')" class="btn btn-primary">
        Открыть сделку "В деньги"
      </button>
      <button @click="openModal('leasing')" class="btn btn-primary">
        Открыть сделку "В лизинг"
      </button>
    </div>

    <DealModal 
      v-if="modalOpen"
      :isOpen="modalOpen"
      :dealType="selectedDealType"
      :hasExistingDeal="hasExistingDeal"
      :existingDealData="existingDealData"
      @create-deal="handleCreateDeal"
      @save-deal="handleSaveDeal"
      @confirm-deal="handleConfirmDeal"
      @close="closeModal"
    />
  </div>
</template>

<script>
import DealModal from './DealModal7.vue'

export default {
  name: 'DealManager',
  components: {
    DealModal
  },
  
  props: {
    // Пропсы для интеграции с основным приложением
    hasExistingDeal: {
      type: Boolean,
      default: false
    },
    existingDealData: {
      type: Object,
      default: () => ({})
    },
    // Для скрытия заголовка и кнопок, если они не нужны
    showHeader: {
      type: Boolean,
      default: true
    },
    showButtons: {
      type: Boolean,
      default: true
    }
  },
  
  data() {
    return {
      modalOpen: false,
      selectedDealType: 'sale'
    }
  },
  
  methods: {
    openModal(dealType) {
      this.selectedDealType = dealType
      this.modalOpen = true
      
      // Эмитим событие для родительского компонента
      this.$emit('modal-opened', { dealType })
    },
    
    closeModal() {
      this.modalOpen = false
      this.$emit('modal-closed')
    },
    
    handleCreateDeal(dealData) {
      console.log('Создаем сделку:', dealData)
      this.$emit('create-deal', dealData)
    },
    
    handleSaveDeal(dealData) {
      console.log('Сохраняем сделку:', dealData)
      this.$emit('save-deal', dealData)
    },
    
    handleConfirmDeal(dealData) {
      console.log('Подтверждаем сделку:', dealData)
      this.$emit('confirm-deal', dealData)
    },
    
    // Публичный метод для открытия модального окна извне
    openDealModal(dealType = 'sale') {
      this.openModal(dealType)
    }
  }
}
</script>

<style scoped>
.deal-manager {
  text-align: center;
}

.deal-manager h1 {
  margin-bottom: 24px;
  color: #1f2937;
  font-size: 24px;
  font-weight: 600;
}

.deal-buttons {
  margin: 20px 0;
  display: flex;
  gap: 12px;
  justify-content: center;
  flex-wrap: wrap;
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

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover {
  background: #2563eb;
}

@media (max-width: 768px) {
  .deal-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .btn {
    width: 100%;
    max-width: 300px;
  }
}
</style>