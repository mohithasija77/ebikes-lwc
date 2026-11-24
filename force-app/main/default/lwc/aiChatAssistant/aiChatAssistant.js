import { LightningElement, track } from 'lwc';
import chat from '@salesforce/apex/EBikesAgentService.chat';

export default class AiChatAssistant extends LightningElement {
    @track messages = [];
    @track userInput = '';
    @track isLoading = false;
    @track errorMessage = '';

    messageIdCounter = 0;

    get isSendDisabled() {
        return !this.userInput.trim() || this.isLoading;
    }

    // FIX 1: hasMessages getter was missing — welcome screen never showed without this
    get hasMessages() {
        return this.messages.length > 0;
    }

    connectedCallback() {
        this.addMessage('assistant', 'Hi! 👋 I\'m your E-Bikes shopping assistant. How can I help you find the perfect bike today?');
    }

    handleInputChange(event) {
        this.userInput = event.target.value;
    }

    handleKeyPress(event) {
        if (event.key === 'Enter' && !this.isSendDisabled) {
            this.handleSend();
        }
    }

    handleSuggestion(event) {
        const message = event.target.dataset.message;
        this.userInput = message;
        this.handleSend();
    }

    // FIX 2: Replaced hardcoded fetch() with Apex callout so the URL
    // doesn't need updating every time ngrok restarts
    async handleSend() {
        if (!this.userInput.trim()) return;

        const userMessage = this.userInput.trim();
        this.userInput = '';

        this.addMessage('user', userMessage);
        this.isLoading = true;

        try {
            const result = await chat({ userMessage });
            const data = JSON.parse(result);

            if (data.success) {
                this.addMessage('assistant', data.message, data.products);
            } else {
                throw new Error(data.error || 'Failed to get response');
            }
        } catch (error) {
            console.error('Error calling agent:', error);
            this.showError('Sorry, I\'m having trouble connecting right now. Please try again!');
            this.addMessage('assistant', 'I apologize, but I\'m having trouble processing your request. Please try again in a moment.');
        } finally {
            this.isLoading = false;
            this.scrollToBottom();
        }
    }

    addMessage(sender, text, products = null) {
        const message = {
            id: `msg-${this.messageIdCounter++}`,
            sender: sender === 'user' ? 'You' : 'AI Assistant',
            text: this.formatMessageText(text),
            time: new Date().toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            }),
            cssClass: sender === 'user' ? 'message user-message' : 'message assistant-message',
            products: products && products.length > 0 ? products.slice(0, 3) : null
        };

        this.messages = [...this.messages, message];
        setTimeout(() => this.scrollToBottom(), 100);
    }

    formatMessageText(text) {
        let formatted = text.replace(/\n/g, '<br>');
        formatted = formatted.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        formatted = formatted.replace(/^[•·-]\s/gm, '&bull; ');
        return formatted;
    }

    scrollToBottom() {
        const container = this.template.querySelector('.messages-container');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }

    // FIX 3: Reset also goes through Apex now — add a reset method to
    // EBikesAgentService if you want server-side reset, otherwise just clears UI
    handleReset() {
        this.messages = [];
        this.userInput = '';
        this.errorMessage = '';
        this.addMessage('assistant', 'Conversation reset! How can I help you today?');
    }

    showError(message) {
        this.errorMessage = message;
        setTimeout(() => {
            this.errorMessage = '';
        }, 5000);
    }

    handleCloseError() {
        this.errorMessage = '';
    }
}