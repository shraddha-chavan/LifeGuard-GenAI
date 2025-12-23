/**
 * Adaptive Guidance Engine
 * Adjusts guidance verbosity dynamically based on inferred user stress level
 */

class AdaptiveGuidanceEngine {
    constructor(options = {}) {
        this.config = {
            stressUpdateInterval: options.stressUpdateInterval || 5000,
            stressDecayRate: options.stressDecayRate || 0.95,
            baselineStressLevel: options.baselineStressLevel || 0.3,
            maxStressLevel: options.maxStressLevel || 1.0,
            guidanceUpdateThreshold: options.guidanceUpdateThreshold || 0.1,
            enableLogging: options.enableLogging || true
        };

        // Stress level tracking
        this.currentStressLevel = this.config.baselineStressLevel;
        this.stressHistory = [];
        this.stressIndicators = {
            interaction_speed: [],
            error_frequency: [],
            help_requests: [],
            navigation_patterns: [],
            response_times: []
        };

        // Verbosity levels
        this.verbosityLevels = {
            MINIMAL: {
                level: 0,
                name: 'Minimal',
                maxWords: 10,
                maxSteps: 3,
                includeExplanations: false,
                includeAlternatives: false,
                useSimpleLanguage: true,
                prioritizeActions: true
            },
            CONCISE: {
                level: 1,
                name: 'Concise',
                maxWords: 25,
                maxSteps: 5,
                includeExplanations: false,
                includeAlternatives: true,
                useSimpleLanguage: true,
                prioritizeActions: true
            },
            STANDARD: {
                level: 2,
                name: 'Standard',
                maxWords: 50,
                maxSteps: 7,
                includeExplanations: true,
                includeAlternatives: true,
                useSimpleLanguage: false,
                prioritizeActions: false
            },
            DETAILED: {
                level: 3,
                name: 'Detailed',
                maxWords: 100,
                maxSteps: 10,
                includeExplanations: true,
                includeAlternatives: true,
                useSimpleLanguage: false,
                prioritizeActions: false
            }
        };

        this.currentVerbosity = this.verbosityLevels.STANDARD;
        this.guidanceHistory = [];

        // Stress detection patterns
        this.stressPatterns = {
            rapid_interactions: { threshold: 3, timeWindow: 10000, stressIncrease: 0.2 },
            repeated_errors: { threshold: 2, timeWindow: 30000, stressIncrease: 0.3 },
            help_seeking: { threshold: 1, timeWindow: 60000, stressIncrease: 0.15 },
            erratic_navigation: { threshold: 5, timeWindow: 20000, stressIncrease: 0.25 },
            slow_responses: { threshold: 10000, stressIncrease: 0.1 }
        };

        this.initialize();
    }

    initialize() {
        this.log('Adaptive Guidance Engine initializing...');
        this.startStressMonitoring();
        this.updateVerbosityLevel();
    }

    recordInteraction(interaction) {
        const timestamp = new Date();
        
        switch (interaction.type) {
            case 'click':
            case 'tap':
                this.recordInteractionSpeed(timestamp);
                break;
            case 'error':
                this.recordError(timestamp, interaction);
                break;
            case 'help_request':
                this.recordHelpRequest(timestamp, interaction);
                break;
            case 'navigation':
                this.recordNavigation(timestamp, interaction);
                break;
            case 'response':
                this.recordResponseTime(timestamp, interaction);
                break;
        }

        this.updateStressLevel();
    }

    generateAdaptiveGuidance(context, baseGuidance) {
        try {
            const verbosity = this.determineVerbosityLevel();
            const adaptedGuidance = this.adaptGuidanceToVerbosity(baseGuidance, verbosity, context);
            const stressAdaptedGuidance = this.applyStressAdaptations(adaptedGuidance, context);
            
            this.recordGuidanceGeneration(stressAdaptedGuidance, verbosity);
            
            return {
                success: true,
                guidance: stressAdaptedGuidance,
                verbosity_level: verbosity,
                stress_level: this.currentStressLevel,
                adaptation_reason: this.getAdaptationReason(),
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            this.log(`Error generating adaptive guidance: ${error.message}`);
            return {
                success: false,
                error: error.message,
                fallback_guidance: baseGuidance
            };
        }
    }

    recordInteractionSpeed(timestamp) {
        this.stressIndicators.interaction_speed.push(timestamp);
        
        const cutoff = new Date(timestamp.getTime() - this.stressPatterns.rapid_interactions.timeWindow);
        this.stressIndicators.interaction_speed = this.stressIndicators.interaction_speed
            .filter(time => time > cutoff);
        
        if (this.stressIndicators.interaction_speed.length >= this.stressPatterns.rapid_interactions.threshold) {
            this.increaseStress(this.stressPatterns.rapid_interactions.stressIncrease, 'rapid_interactions');
        }
    }

    recordError(timestamp, interaction) {
        this.stressIndicators.error_frequency.push({
            timestamp: timestamp,
            type: interaction.errorType || 'unknown',
            severity: interaction.severity || 'medium'
        });
        
        const cutoff = new Date(timestamp.getTime() - this.stressPatterns.repeated_errors.timeWindow);
        this.stressIndicators.error_frequency = this.stressIndicators.error_frequency
            .filter(error => error.timestamp > cutoff);
        
        if (this.stressIndicators.error_frequency.length >= this.stressPatterns.repeated_errors.threshold) {
            this.increaseStress(this.stressPatterns.repeated_errors.stressIncrease, 'repeated_errors');
        }
    }

    recordHelpRequest(timestamp, interaction) {
        this.stressIndicators.help_requests.push({
            timestamp: timestamp,
            type: interaction.helpType || 'general',
            urgency: interaction.urgency || 'normal'
        });
        
        const cutoff = new Date(timestamp.getTime() - this.stressPatterns.help_seeking.timeWindow);
        this.stressIndicators.help_requests = this.stressIndicators.help_requests
            .filter(request => request.timestamp > cutoff);
        
        this.increaseStress(this.stressPatterns.help_seeking.stressIncrease, 'help_seeking');
    }

    recordNavigation(timestamp, interaction) {
        this.stressIndicators.navigation_patterns.push({
            timestamp: timestamp,
            from: interaction.from,
            to: interaction.to,
            method: interaction.method || 'click'
        });
        
        const cutoff = new Date(timestamp.getTime() - this.stressPatterns.erratic_navigation.timeWindow);
        this.stressIndicators.navigation_patterns = this.stressIndicators.navigation_patterns
            .filter(nav => nav.timestamp > cutoff);
        
        if (this.stressIndicators.navigation_patterns.length >= this.stressPatterns.erratic_navigation.threshold) {
            this.increaseStress(this.stressPatterns.erratic_navigation.stressIncrease, 'erratic_navigation');
        }
    }

    recordResponseTime(timestamp, interaction) {
        const responseTime = interaction.responseTime || 0;
        
        this.stressIndicators.response_times.push({
            timestamp: timestamp,
            responseTime: responseTime,
            taskType: interaction.taskType || 'unknown'
        });
        
        const cutoff = new Date(timestamp.getTime() - 60000);
        this.stressIndicators.response_times = this.stressIndicators.response_times
            .filter(response => response.timestamp > cutoff);
        
        if (responseTime > this.stressPatterns.slow_responses.threshold) {
            this.increaseStress(this.stressPatterns.slow_responses.stressIncrease, 'slow_responses');
        }
    }

    increaseStress(amount, reason) {
        const oldStress = this.currentStressLevel;
        this.currentStressLevel = Math.min(
            this.config.maxStressLevel,
            this.currentStressLevel + amount
        );
        
        this.log(`Stress increased: ${oldStress.toFixed(2)} → ${this.currentStressLevel.toFixed(2)} (${reason})`);
        
        this.stressHistory.push({
            timestamp: new Date(),
            level: this.currentStressLevel,
            change: amount,
            reason: reason
        });
        
        if (Math.abs(amount) >= this.config.guidanceUpdateThreshold) {
            this.updateVerbosityLevel();
        }
    }

    updateStressLevel() {
        const oldStress = this.currentStressLevel;
        this.currentStressLevel = Math.max(
            this.config.baselineStressLevel,
            this.currentStressLevel * this.config.stressDecayRate
        );
        
        if (Math.abs(oldStress - this.currentStressLevel) >= this.config.guidanceUpdateThreshold) {
            this.updateVerbosityLevel();
        }
    }

    determineVerbosityLevel() {
        const stress = this.currentStressLevel;
        
        if (stress >= 0.8) {
            return this.verbosityLevels.MINIMAL;
        } else if (stress >= 0.6) {
            return this.verbosityLevels.CONCISE;
        } else if (stress >= 0.4) {
            return this.verbosityLevels.STANDARD;
        } else {
            return this.verbosityLevels.DETAILED;
        }
    }

    updateVerbosityLevel() {
        const newVerbosity = this.determineVerbosityLevel();
        
        if (newVerbosity.level !== this.currentVerbosity.level) {
            const oldLevel = this.currentVerbosity.name;
            this.currentVerbosity = newVerbosity;
            
            this.log(`Verbosity changed: ${oldLevel} → ${newVerbosity.name} (stress: ${this.currentStressLevel.toFixed(2)})`);
        }
    }

    adaptGuidanceToVerbosity(baseGuidance, verbosity, context) {
        const adapted = {
            primary_message: '',
            steps: [],
            explanations: [],
            alternatives: [],
            tone: this.determineTone(verbosity),
            urgency: context.urgency || 'normal'
        };

        adapted.primary_message = this.generatePrimaryMessage(baseGuidance, verbosity, context);
        adapted.steps = this.adaptSteps(baseGuidance, verbosity);

        if (verbosity.includeExplanations) {
            adapted.explanations = this.generateExplanations(baseGuidance, verbosity);
        }

        if (verbosity.includeAlternatives) {
            adapted.alternatives = this.generateAlternatives(baseGuidance, verbosity);
        }

        return adapted;
    }

    applyStressAdaptations(guidance, context) {
        const stressLevel = this.currentStressLevel;
        const adapted = { ...guidance };

        // High stress adaptations
        if (stressLevel >= 0.7) {
            adapted.tone = 'calm_authoritative';
            adapted.primary_message = this.makeMessageCalming(adapted.primary_message);
            adapted.steps = this.prioritizeImmediateActions(adapted.steps);
        }
        // Medium stress adaptations
        else if (stressLevel >= 0.5) {
            adapted.tone = 'supportive';
            adapted.steps = this.addConfidenceBuilders(adapted.steps);
        }
        // Low stress - can provide more detail
        else if (stressLevel < 0.3) {
            adapted.tone = 'informative';
            adapted.explanations = this.expandExplanations(adapted.explanations);
        }

        return adapted;
    }

    generatePrimaryMessage(baseGuidance, verbosity, context) {
        const urgency = context.urgency || 'normal';
        let message = '';

        if (verbosity.level === 0) { // MINIMAL
            if (urgency === 'high') {
                message = baseGuidance.emergency_action || 'Take immediate action';
            } else {
                message = baseGuidance.key_action || 'Follow safety steps';
            }
        } else if (verbosity.level === 1) { // CONCISE
            message = baseGuidance.brief_summary || 'Follow these safety steps carefully';
        } else { // STANDARD or DETAILED
            message = baseGuidance.full_message || 'Here are the recommended safety actions for your situation';
        }

        return this.limitWords(message, verbosity.maxWords);
    }

    adaptSteps(baseGuidance, verbosity) {
        let steps = baseGuidance.steps || [];
        
        // Limit number of steps
        steps = steps.slice(0, verbosity.maxSteps);
        
        // Simplify language if needed
        if (verbosity.useSimpleLanguage) {
            steps = steps.map(step => this.simplifyLanguage(step));
        }
        
        // Prioritize actions if needed
        if (verbosity.prioritizeActions) {
            steps = this.prioritizeActionSteps(steps);
        }
        
        return steps;
    }

    generateExplanations(baseGuidance, verbosity) {
        if (!baseGuidance.explanations) return [];
        
        let explanations = baseGuidance.explanations;
        
        if (verbosity.useSimpleLanguage) {
            explanations = explanations.map(exp => this.simplifyLanguage(exp));
        }
        
        return explanations.map(exp => this.limitWords(exp, verbosity.maxWords));
    }

    generateAlternatives(baseGuidance, verbosity) {
        if (!baseGuidance.alternatives) return [];
        
        let alternatives = baseGuidance.alternatives.slice(0, 3); // Limit alternatives
        
        if (verbosity.useSimpleLanguage) {
            alternatives = alternatives.map(alt => this.simplifyLanguage(alt));
        }
        
        return alternatives;
    }

    determineTone(verbosity) {
        if (verbosity.level <= 1) {
            return 'direct';
        } else if (verbosity.level === 2) {
            return 'balanced';
        } else {
            return 'explanatory';
        }
    }

    makeMessageCalming(message) {
        // Add calming prefixes for high stress situations
        const calmingPrefixes = [
            'Stay calm. ',
            'Take a breath. ',
            'You can handle this. '
        ];
        
        const prefix = calmingPrefixes[Math.floor(Math.random() * calmingPrefixes.length)];
        return prefix + message;
    }

    prioritizeImmediateActions(steps) {
        // Move immediate action words to front
        const immediateKeywords = ['call', 'move', 'exit', 'stop', 'go', 'run'];
        
        return steps.sort((a, b) => {
            const aHasImmediate = immediateKeywords.some(keyword => 
                a.toLowerCase().includes(keyword));
            const bHasImmediate = immediateKeywords.some(keyword => 
                b.toLowerCase().includes(keyword));
            
            if (aHasImmediate && !bHasImmediate) return -1;
            if (!aHasImmediate && bHasImmediate) return 1;
            return 0;
        });
    }

    addConfidenceBuilders(steps) {
        // Add confidence-building phrases
        const confidenceBuilders = [
            'You\'re doing great. ',
            'This will help keep you safe. ',
            'Good job following these steps. '
        ];
        
        return steps.map((step, index) => {
            if (index === Math.floor(steps.length / 2)) {
                const builder = confidenceBuilders[Math.floor(Math.random() * confidenceBuilders.length)];
                return builder + step;
            }
            return step;
        });
    }

    expandExplanations(explanations) {
        // For low stress, can provide more detailed explanations
        return explanations.map(exp => {
            return exp + ' This helps ensure your safety by reducing potential risks.';
        });
    }

    simplifyLanguage(text) {
        // Replace complex words with simpler alternatives
        const simplifications = {
            'immediately': 'now',
            'proceed': 'go',
            'utilize': 'use',
            'assistance': 'help',
            'location': 'place',
            'emergency': 'danger',
            'evacuate': 'leave',
            'vicinity': 'area'
        };
        
        let simplified = text;
        for (const [complex, simple] of Object.entries(simplifications)) {
            simplified = simplified.replace(new RegExp(complex, 'gi'), simple);
        }
        
        return simplified;
    }

    prioritizeActionSteps(steps) {
        // Prioritize steps that contain action verbs
        const actionVerbs = ['go', 'move', 'call', 'find', 'get', 'take', 'use', 'avoid'];
        
        return steps.sort((a, b) => {
            const aHasAction = actionVerbs.some(verb => a.toLowerCase().startsWith(verb));
            const bHasAction = actionVerbs.some(verb => b.toLowerCase().startsWith(verb));
            
            if (aHasAction && !bHasAction) return -1;
            if (!aHasAction && bHasAction) return 1;
            return 0;
        });
    }

    limitWords(text, maxWords) {
        const words = text.split(' ');
        if (words.length <= maxWords) return text;
        
        return words.slice(0, maxWords).join(' ') + '...';
    }

    startStressMonitoring() {
        setInterval(() => {
            this.updateStressLevel();
        }, this.config.stressUpdateInterval);
    }

    recordGuidanceGeneration(guidance, verbosity) {
        this.guidanceHistory.push({
            timestamp: new Date(),
            verbosity_level: verbosity.name,
            stress_level: this.currentStressLevel,
            guidance_length: guidance.steps.length,
            primary_message_length: guidance.primary_message.length
        });
        
        // Keep only recent history
        if (this.guidanceHistory.length > 50) {
            this.guidanceHistory = this.guidanceHistory.slice(-50);
        }
    }

    getAdaptationReason() {
        const stress = this.currentStressLevel;
        
        if (stress >= 0.8) {
            return 'High stress detected - providing minimal, calming guidance';
        } else if (stress >= 0.6) {
            return 'Moderate stress detected - providing concise, clear guidance';
        } else if (stress >= 0.4) {
            return 'Normal stress level - providing standard guidance';
        } else {
            return 'Low stress detected - providing detailed, comprehensive guidance';
        }
    }

    // Status and utility methods
    getStressLevel() {
        return {
            current: this.currentStressLevel,
            baseline: this.config.baselineStressLevel,
            verbosity: this.currentVerbosity.name,
            recent_indicators: this.getRecentStressIndicators()
        };
    }

    getRecentStressIndicators() {
        const now = new Date();
        const recent = new Date(now.getTime() - 60000); // Last minute
        
        return {
            interactions: this.stressIndicators.interaction_speed.filter(t => t > recent).length,
            errors: this.stressIndicators.error_frequency.filter(e => e.timestamp > recent).length,
            help_requests: this.stressIndicators.help_requests.filter(h => h.timestamp > recent).length,
            navigation_changes: this.stressIndicators.navigation_patterns.filter(n => n.timestamp > recent).length
        };
    }

    getCurrentVerbosity() {
        return {
            level: this.currentVerbosity.name,
            max_words: this.currentVerbosity.maxWords,
            max_steps: this.currentVerbosity.maxSteps,
            include_explanations: this.currentVerbosity.includeExplanations,
            simple_language: this.currentVerbosity.useSimpleLanguage
        };
    }

    getGuidanceHistory() {
        return [...this.guidanceHistory];
    }

    reset() {
        this.currentStressLevel = this.config.baselineStressLevel;
        this.stressHistory = [];
        this.guidanceHistory = [];
        
        // Clear stress indicators
        for (const key in this.stressIndicators) {
            this.stressIndicators[key] = [];
        }
        
        this.updateVerbosityLevel();
        this.log('Adaptive Guidance Engine reset');
    }

    log(message) {
        if (this.config.enableLogging) {
            console.log(`[AdaptiveGuidanceEngine] ${new Date().toISOString()}: ${message}`);
        }
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdaptiveGuidanceEngine;
}

// Make available globally for browser use
if (typeof window !== 'undefined') {
    window.AdaptiveGuidanceEngine = AdaptiveGuidanceEngine;
}