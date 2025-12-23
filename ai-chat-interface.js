/**
 * 🤖 AI Chat Interface - Conversational Safety Assistant
 * Natural language interaction with LifeGuard AI
 */

class LifeGuardChatAI {
    constructor() {
        this.conversationHistory = [];
        this.userContext = {};
        this.isListening = false;
        this.speechRecognition = null;
        this.speechSynthesis = null;
        this.currentConversationId = this.generateConversationId();
        
        this.initialize();
    }

    async initialize() {
        this.setupSpeechRecognition();
        this.setupSpeechSynthesis();
        this.loadConversationTemplates();
        console.log('🤖 AI Chat Interface Ready!');
    }

    /**
     * 💬 Process User Message
     */
    async processMessage(userMessage, context = {}) {
        try {
            // Add user message to history
            this.addToHistory('user', userMessage);
            
            // Analyze user intent and extract safety concerns
            const analysis = await this.analyzeUserIntent(userMessage);
            
            // Generate contextual AI response
            const aiResponse = await this.generateAIResponse(userMessage, analysis, context);
            
            // Add AI response to history
            this.addToHistory('assistant', aiResponse.text);
            
            // Determine if voice response is needed
            if (analysis.urgency === 'high' || analysis.requestsVoice) {
                await this.speakResponse(aiResponse.text, analysis.urgency);
            }

            return {
                success: true,
                response: aiResponse,
                analysis: analysis,
                conversation_id: this.currentConversationId,
                follow_up_suggestions: this.generateFollowUpSuggestions(analysis)
            };

        } catch (error) {
            console.error('🚨 Chat AI Error:', error);
            return {
                success: false,
                error: error.message,
                fallback_response: this.getFallbackResponse()
            };
        }
    }

    /**
     * 🧠 Analyze User Intent
     */
    async analyzeUserIntent(message) {
        const lowercaseMessage = message.toLowerCase();
        
        // Safety keyword detection
        const safetyKeywords = {
            emergency: ['help', 'emergency', 'danger', 'urgent', 'scared', 'threat'],
            weather: ['rain', 'storm', 'wind', 'snow', 'weather', 'forecast'],
            crowd: ['crowded', 'busy', 'people', 'crowd', 'packed', 'empty'],
            location: ['where', 'location', 'address', 'place', 'area', 'route'],
            guidance: ['what should', 'how do', 'advice', 'recommend', 'suggest'],
            status: ['how am i', 'status', 'safe', 'risk level', 'assessment']
        };

        const detectedIntents = [];
        const detectedKeywords = [];
        
        for (const [intent, keywords] of Object.entries(safetyKeywords)) {
            for (const keyword of keywords) {
                if (lowercaseMessage.includes(keyword)) {
                    detectedIntents.push(intent);
                    detectedKeywords.push(keyword);
                }
            }
        }

        // Determine urgency level
        const urgencyIndicators = ['help', 'emergency', 'urgent', 'now', 'immediately', 'danger'];
        const urgency = urgencyIndicators.some(indicator => 
            lowercaseMessage.includes(indicator)) ? 'high' : 'normal';

        // Detect emotional state
        const emotionalState = this.detectEmotionalState(message);

        // Check if user wants voice response
        const requestsVoice = lowercaseMessage.includes('tell me') || 
                             lowercaseMessage.includes('speak') ||
                             urgency === 'high';

        return {
            intents: [...new Set(detectedIntents)],
            keywords: [...new Set(detectedKeywords)],
            urgency: urgency,
            emotional_state: emotionalState,
            requestsVoice: requestsVoice,
            message_type: this.classifyMessageType(lowercaseMessage),
            confidence: this.calculateIntentConfidence(detectedIntents, detectedKeywords)
        };
    }

    /**
     * 🎯 Generate AI Response
     */
    async generateAIResponse(userMessage, analysis, context) {
        const responseTemplates = this.getResponseTemplates();
        let response = '';
        let actions = [];
        let priority = 'normal';

        // Handle different intent types
        if (analysis.intents.includes('emergency')) {
            response = await this.handleEmergencyIntent(userMessage, context);
            priority = 'critical';
            actions = ['contact_emergency', 'share_location', 'provide_guidance'];
        } else if (analysis.intents.includes('status')) {
            response = await this.handleStatusIntent(context);
            actions = ['show_risk_assessment', 'update_display'];
        } else if (analysis.intents.includes('weather')) {
            response = await this.handleWeatherIntent(userMessage, context);
            actions = ['update_weather', 'show_forecast'];
        } else if (analysis.intents.includes('crowd')) {
            response = await this.handleCrowdIntent(userMessage, context);
            actions = ['analyze_crowd', 'suggest_routes'];
        } else if (analysis.intents.includes('guidance')) {
            response = await this.handleGuidanceIntent(userMessage, context);
            actions = ['provide_recommendations', 'show_tips'];
        } else {
            response = await this.handleGeneralIntent(userMessage, analysis, context);
            actions = ['general_assistance'];
        }

        // Add personality and empathy based on emotional state
        response = this.addPersonalityToResponse(response, analysis.emotional_state);

        return {
            text: response,
            actions: actions,
            priority: priority,
            emotional_tone: this.determineResponseTone(analysis),
            suggested_follow_ups: this.generateContextualFollowUps(analysis, context)
        };
    }

    /**
     * 🚨 Handle Emergency Intent
     */
    async handleEmergencyIntent(message, context) {
        const emergencyResponses = [
            "🚨 I understand this is urgent. I'm here to help you stay safe. First, are you in immediate physical danger?",
            "🛡️ Emergency mode activated. Let me assess your situation quickly. Can you tell me your current location?",
            "⚡ I'm prioritizing your safety right now. Based on your location, I'm analyzing the best immediate actions."
        ];

        const baseResponse = emergencyResponses[Math.floor(Math.random() * emergencyResponses.length)];
        
        // Add contextual emergency guidance
        let contextualGuidance = "";
        if (context.currentLocation) {
            contextualGuidance += ` I can see you're at ${context.currentLocation.latitude?.toFixed(4)}, ${context.currentLocation.longitude?.toFixed(4)}.`;
        }
        
        if (context.riskAssessment?.risk_level === 'HIGH') {
            contextualGuidance += " Current risk level is HIGH - I recommend immediate safety measures.";
        }

        return baseResponse + contextualGuidance + " What specific help do you need right now?";
    }

    /**
     * 📊 Handle Status Intent
     */
    async handleStatusIntent(context) {
        if (!context.riskAssessment) {
            return "🔍 Let me check your current safety status... I'm analyzing your environment now.";
        }

        const risk = context.riskAssessment;
        const riskEmojis = { LOW: '✅', MEDIUM: '⚠️', HIGH: '🚨' };
        const emoji = riskEmojis[risk.risk_level] || '🔍';

        let statusResponse = `${emoji} Your current risk level is ${risk.risk_level} (${risk.risk_score?.toFixed(1)}/10). `;

        // Add specific factor information
        if (context.weatherData) {
            statusResponse += `Weather conditions are ${context.weatherData.condition} with ${context.weatherData.temperature}°C. `;
        }

        if (context.crowdData) {
            statusResponse += `Crowd density is ${context.crowdData.level}. `;
        }

        // Add recommendations based on status
        if (risk.risk_level === 'HIGH') {
            statusResponse += "I recommend taking immediate precautions and considering safer alternatives.";
        } else if (risk.risk_level === 'MEDIUM') {
            statusResponse += "Stay alert and monitor conditions as they may change.";
        } else {
            statusResponse += "Conditions are favorable for your current activities.";
        }

        return statusResponse;
    }

    /**
     * 🌤️ Handle Weather Intent
     */
    async handleWeatherIntent(message, context) {
        if (!context.weatherData) {
            return "🌤️ I'm checking the current weather conditions for you...";
        }

        const weather = context.weatherData;
        let weatherResponse = `🌤️ Current weather: ${weather.description} at ${weather.temperature}°C. `;
        
        if (weather.windSpeed > 20) {
            weatherResponse += "⚠️ Strong winds detected - be cautious of flying debris. ";
        }
        
        if (weather.visibility < 5) {
            weatherResponse += "🌫️ Reduced visibility - use extra caution when moving. ";
        }
        
        if (weather.severity_score > 3) {
            weatherResponse += "🚨 Weather conditions pose elevated risks - consider indoor alternatives.";
        } else {
            weatherResponse += "Weather conditions are manageable with proper precautions.";
        }

        return weatherResponse;
    }

    /**
     * 👥 Handle Crowd Intent
     */
    async handleCrowdIntent(message, context) {
        if (!context.crowdData) {
            return "👥 I'm analyzing the crowd situation around you...";
        }

        const crowd = context.crowdData;
        let crowdResponse = `👥 Current crowd level: ${crowd.level}. `;
        
        if (crowd.estimated_people) {
            crowdResponse += `Approximately ${crowd.estimated_people} people in the area. `;
        }
        
        if (crowd.trend === 'increasing') {
            crowdResponse += "📈 Crowd density is increasing - consider alternative routes or timing. ";
        } else if (crowd.trend === 'decreasing') {
            crowdResponse += "📉 Crowd density is decreasing - conditions are improving. ";
        }
        
        if (crowd.peak_hours) {
            crowdResponse += "⏰ This is a peak activity period for this location.";
        }

        return crowdResponse;
    }

    /**
     * 💡 Handle Guidance Intent
     */
    async handleGuidanceIntent(message, context) {
        const guidanceResponses = [
            "💡 Based on current conditions, here's what I recommend:",
            "🎯 Let me provide some personalized safety guidance:",
            "🛡️ Here are the best actions for your current situation:"
        ];

        let response = guidanceResponses[Math.floor(Math.random() * guidanceResponses.length)];
        
        // Add specific recommendations based on context
        if (context.riskAssessment?.recommendations) {
            const recommendations = context.riskAssessment.recommendations.slice(0, 3);
            response += "\n\n" + recommendations.map((rec, i) => `${i + 1}. ${rec}`).join('\n');
        }

        return response;
    }

    /**
     * 🤝 Handle General Intent
     */
    async handleGeneralIntent(message, analysis, context) {
        const generalResponses = [
            "🤖 I'm here to help keep you safe. What would you like to know about your current environment?",
            "🛡️ I'm monitoring your safety conditions. Is there something specific you're concerned about?",
            "💬 I'm your AI safety assistant. How can I help you stay protected today?"
        ];

        let response = generalResponses[Math.floor(Math.random() * generalResponses.length)];
        
        // Add contextual information if available
        if (context.riskAssessment) {
            response += ` Your current risk level is ${context.riskAssessment.risk_level}.`;
        }

        return response;
    }

    /**
     * 🎭 Detect Emotional State
     */
    detectEmotionalState(message) {
        const emotionKeywords = {
            anxious: ['worried', 'nervous', 'anxious', 'scared', 'afraid'],
            calm: ['fine', 'okay', 'good', 'calm', 'relaxed'],
            urgent: ['urgent', 'quickly', 'now', 'immediate', 'fast'],
            confused: ['confused', 'unsure', 'don\'t know', 'not sure', 'help']
        };

        const lowercaseMessage = message.toLowerCase();
        
        for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
            if (keywords.some(keyword => lowercaseMessage.includes(keyword))) {
                return emotion;
            }
        }

        return 'neutral';
    }

    /**
     * 🎨 Add Personality to Response
     */
    addPersonalityToResponse(response, emotionalState) {
        const personalityAdjustments = {
            anxious: {
                prefix: "I understand you're feeling concerned. ",
                tone: "reassuring"
            },
            urgent: {
                prefix: "I'll help you quickly. ",
                tone: "efficient"
            },
            confused: {
                prefix: "Let me explain this clearly. ",
                tone: "patient"
            },
            calm: {
                prefix: "",
                tone: "friendly"
            }
        };

        const adjustment = personalityAdjustments[emotionalState] || personalityAdjustments.calm;
        return adjustment.prefix + response;
    }

    /**
     * 🗣️ Speech Recognition Setup
     */
    setupSpeechRecognition() {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.speechRecognition = new SpeechRecognition();
            
            this.speechRecognition.continuous = false;
            this.speechRecognition.interimResults = false;
            this.speechRecognition.lang = 'en-US';
            
            this.speechRecognition.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                this.handleVoiceInput(transcript);
            };
            
            this.speechRecognition.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
            };
        }
    }

    /**
     * 🔊 Speech Synthesis Setup
     */
    setupSpeechSynthesis() {
        if ('speechSynthesis' in window) {
            this.speechSynthesis = window.speechSynthesis;
        }
    }

    /**
     * 🎤 Start Voice Input
     */
    startListening() {
        if (this.speechRecognition && !this.isListening) {
            this.isListening = true;
            this.speechRecognition.start();
        }
    }

    /**
     * 🔇 Stop Voice Input
     */
    stopListening() {
        if (this.speechRecognition && this.isListening) {
            this.isListening = false;
            this.speechRecognition.stop();
        }
    }

    /**
     * 🗣️ Speak Response
     */
    async speakResponse(text, urgency = 'normal') {
        if (!this.speechSynthesis) return;

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Adjust voice settings based on urgency
        if (urgency === 'high') {
            utterance.rate = 1.1;
            utterance.pitch = 1.1;
            utterance.volume = 0.9;
        } else {
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 0.8;
        }

        this.speechSynthesis.speak(utterance);
    }

    /**
     * 🎤 Handle Voice Input
     */
    async handleVoiceInput(transcript) {
        console.log('🎤 Voice input received:', transcript);
        
        // Process the voice input as a regular message
        const response = await this.processMessage(transcript, window.lifeGuardAI || {});
        
        // Trigger UI update with voice response
        this.displayChatMessage('user', transcript, true);
        this.displayChatMessage('assistant', response.response.text, false);
        
        // Speak the response if it's urgent or requested
        if (response.analysis.urgency === 'high' || response.analysis.requestsVoice) {
            await this.speakResponse(response.response.text, response.analysis.urgency);
        }
    }

    /**
     * 💬 Display Chat Message in UI
     */
    displayChatMessage(sender, message, isVoice = false) {
        // This would integrate with the main UI to show chat messages
        console.log(`${sender === 'user' ? '👤' : '🤖'} ${isVoice ? '🎤' : '💬'}: ${message}`);
        
        // Trigger custom event for UI integration
        window.dispatchEvent(new CustomEvent('chatMessage', {
            detail: { sender, message, isVoice, timestamp: new Date().toISOString() }
        }));
    }

    /**
     * 📝 Add to Conversation History
     */
    addToHistory(role, content) {
        this.conversationHistory.push({
            role: role,
            content: content,
            timestamp: new Date().toISOString(),
            conversation_id: this.currentConversationId
        });

        // Keep only last 20 messages to manage memory
        if (this.conversationHistory.length > 20) {
            this.conversationHistory = this.conversationHistory.slice(-20);
        }
    }

    /**
     * 🔄 Generate Follow-up Suggestions
     */
    generateFollowUpSuggestions(analysis) {
        const suggestions = [];
        
        if (analysis.intents.includes('weather')) {
            suggestions.push("Should I monitor weather changes?");
            suggestions.push("What should I do if weather worsens?");
        }
        
        if (analysis.intents.includes('crowd')) {
            suggestions.push("Show me alternative routes");
            suggestions.push("When will crowds decrease?");
        }
        
        if (analysis.intents.includes('status')) {
            suggestions.push("What can I do to improve safety?");
            suggestions.push("Show me detailed risk breakdown");
        }

        // Default suggestions
        if (suggestions.length === 0) {
            suggestions.push("What's my current risk level?");
            suggestions.push("Any safety recommendations?");
            suggestions.push("Monitor my location");
        }

        return suggestions.slice(0, 3); // Return top 3 suggestions
    }

    // Utility Methods
    generateConversationId() {
        return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    classifyMessageType(message) {
        if (message.includes('?')) return 'question';
        if (message.includes('help') || message.includes('emergency')) return 'request';
        return 'statement';
    }

    calculateIntentConfidence(intents, keywords) {
        return Math.min(1.0, (intents.length * 0.3 + keywords.length * 0.1));
    }

    determineResponseTone(analysis) {
        if (analysis.urgency === 'high') return 'urgent';
        if (analysis.emotional_state === 'anxious') return 'reassuring';
        if (analysis.emotional_state === 'confused') return 'explanatory';
        return 'friendly';
    }

    getFallbackResponse() {
        return "🤖 I'm here to help with your safety. Could you please rephrase your question or tell me what specific assistance you need?";
    }

    loadConversationTemplates() {
        // Load pre-defined conversation templates for common scenarios
        this.templates = {
            greeting: "👋 Hello! I'm your AI safety assistant. How can I help keep you safe today?",
            goodbye: "🛡️ Stay safe! I'm always here if you need assistance.",
            unclear: "🤔 I want to make sure I understand correctly. Could you tell me more about what you need help with?"
        };
    }

    getResponseTemplates() {
        return this.templates;
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LifeGuardChatAI;
}

if (typeof window !== 'undefined') {
    window.LifeGuardChatAI = LifeGuardChatAI;
}