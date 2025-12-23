/**
 * Risk State Machine
 * Finite state machine controlling app behavior based on risk levels
 */

class RiskStateMachine {
    constructor(options = {}) {
        // Configuration
        this.config = {
            enableLogging: options.enableLogging || true,
            autoTransitions: options.autoTransitions !== false,
            persistState: options.persistState || false,
            transitionDelay: options.transitionDelay || 0,
            maxStateHistory: options.maxStateHistory || 50
        };

        // Define all possible states
        this.states = {
            INITIALIZING: {
                name: 'INITIALIZING',
                description: 'System starting up and gathering initial data',
                allowedTransitions: ['MONITORING', 'ERROR'],
                behaviors: {
                    ui_mode: 'loading',
                    monitoring_frequency: 0,
                    alert_level: 'none',
                    user_actions: ['wait'],
                    data_collection: 'basic'
                }
            },
            MONITORING: {
                name: 'MONITORING',
                description: 'Normal operation - monitoring environmental conditions',
                allowedTransitions: ['LOW_RISK', 'MEDIUM_RISK', 'HIGH_RISK', 'CRITICAL_RISK', 'ERROR', 'MAINTENANCE'],
                behaviors: {
                    ui_mode: 'normal',
                    monitoring_frequency: 30000, // 30 seconds
                    alert_level: 'info',
                    user_actions: ['view_status', 'manual_assessment', 'settings'],
                    data_collection: 'standard'
                }
            },
            LOW_RISK: {
                name: 'LOW_RISK',
                description: 'Low risk conditions detected',
                allowedTransitions: ['MONITORING', 'MEDIUM_RISK', 'HIGH_RISK', 'CRITICAL_RISK', 'ERROR'],
                behaviors: {
                    ui_mode: 'normal',
                    monitoring_frequency: 60000, // 1 minute
                    alert_level: 'success',
                    user_actions: ['continue_activity', 'view_details', 'manual_check'],
                    data_collection: 'standard',
                    notifications: 'minimal'
                }
            },
            MEDIUM_RISK: {
                name: 'MEDIUM_RISK',
                description: 'Medium risk conditions - increased caution required',
                allowedTransitions: ['LOW_RISK', 'MONITORING', 'HIGH_RISK', 'CRITICAL_RISK', 'ERROR'],
                behaviors: {
                    ui_mode: 'caution',
                    monitoring_frequency: 15000, // 15 seconds
                    alert_level: 'warning',
                    user_actions: ['review_conditions', 'get_recommendations', 'contact_others', 'prepare_exit'],
                    data_collection: 'enhanced',
                    notifications: 'standard'
                }
            },
            HIGH_RISK: {
                name: 'HIGH_RISK',
                description: 'High risk conditions - immediate attention required',
                allowedTransitions: ['MEDIUM_RISK', 'CRITICAL_RISK', 'EMERGENCY_MODE', 'ERROR'],
                behaviors: {
                    ui_mode: 'alert',
                    monitoring_frequency: 5000, // 5 seconds
                    alert_level: 'danger',
                    user_actions: ['take_shelter', 'evacuate_area', 'call_emergency', 'follow_plan'],
                    data_collection: 'intensive',
                    notifications: 'urgent',
                    auto_actions: ['send_location', 'log_incident']
                }
            },
            CRITICAL_RISK: {
                name: 'CRITICAL_RISK',
                description: 'Critical risk - emergency protocols activated',
                allowedTransitions: ['EMERGENCY_MODE', 'HIGH_RISK', 'ERROR'],
                behaviors: {
                    ui_mode: 'emergency',
                    monitoring_frequency: 2000, // 2 seconds
                    alert_level: 'critical',
                    user_actions: ['emergency_evacuation', 'call_911', 'follow_emergency_plan'],
                    data_collection: 'maximum',
                    notifications: 'emergency',
                    auto_actions: ['emergency_contacts', 'location_broadcast', 'incident_logging']
                }
            },
            EMERGENCY_MODE: {
                name: 'EMERGENCY_MODE',
                description: 'Emergency mode - all safety protocols active',
                allowedTransitions: ['CRITICAL_RISK', 'HIGH_RISK', 'RECOVERY', 'ERROR'],
                behaviors: {
                    ui_mode: 'emergency_full',
                    monitoring_frequency: 1000, // 1 second
                    alert_level: 'emergency',
                    user_actions: ['follow_emergency_instructions', 'confirm_safety'],
                    data_collection: 'emergency',
                    notifications: 'continuous',
                    auto_actions: ['continuous_location', 'emergency_services', 'family_notification']
                }
            },
            RECOVERY: {
                name: 'RECOVERY',
                description: 'Recovering from emergency - assessing situation',
                allowedTransitions: ['MONITORING', 'LOW_RISK', 'MEDIUM_RISK', 'HIGH_RISK', 'ERROR'],
                behaviors: {
                    ui_mode: 'recovery',
                    monitoring_frequency: 10000, // 10 seconds
                    alert_level: 'info',
                    user_actions: ['assess_damage', 'report_status', 'seek_help', 'return_to_safety'],
                    data_collection: 'assessment',
                    notifications: 'recovery'
                }
            },
            MAINTENANCE: {
                name: 'MAINTENANCE',
                description: 'System maintenance mode',
                allowedTransitions: ['MONITORING', 'ERROR'],
                behaviors: {
                    ui_mode: 'maintenance',
                    monitoring_frequency: 0,
                    alert_level: 'info',
                    user_actions: ['wait', 'contact_support'],
                    data_collection: 'none'
                }
            },
            ERROR: {
                name: 'ERROR',
                description: 'System error - limited functionality',
                allowedTransitions: ['INITIALIZING', 'MONITORING', 'MAINTENANCE'],
                behaviors: {
                    ui_mode: 'error',
                    monitoring_frequency: 0,
                    alert_level: 'error',
                    user_actions: ['restart', 'contact_support', 'manual_mode'],
                    data_collection: 'error_logging'
                }
            }
        };

        // Current state
        this.currentState = this.states.INITIALIZING;
        this.previousState = null;
        this.stateHistory = [];
        this.transitionListeners = [];
        this.behaviorHandlers = {};

        // Timers and intervals
        this.monitoringTimer = null;
        this.transitionTimer = null;

        // State data
        this.stateData = {
            entryTime: new Date(),
            transitionCount: 0,
            lastRiskAssessment: null,
            emergencyContacts: [],
            userLocation: null
        };

        // Initialize the state machine
        this.initialize();
    }

    /**
     * Initialize the state machine
     */
    initialize() {
        this.log('State machine initializing...');
        this.enterState(this.states.INITIALIZING);
        
        // Auto-transition to monitoring after initialization
        if (this.config.autoTransitions) {
            setTimeout(() => {
                this.transition('MONITORING', { reason: 'initialization_complete' });
            }, 1000);
        }
    }

    /**
     * Transition to a new state
     * @param {string} newStateName - Name of the state to transition to
     * @param {Object} context - Additional context for the transition
     * @returns {boolean} Success of the transition
     */
    transition(newStateName, context = {}) {
        try {
            const newState = this.states[newStateName];
            
            if (!newState) {
                throw new Error(`Invalid state: ${newStateName}`);
            }

            // Check if transition is allowed
            if (!this.isTransitionAllowed(newStateName)) {
                this.log(`Transition from ${this.currentState.name} to ${newStateName} not allowed`);
                return false;
            }

            // Execute transition
            const transitionResult = this.executeTransition(newState, context);
            
            if (transitionResult.success) {
                this.log(`Successfully transitioned from ${this.previousState?.name} to ${newStateName}`);
                return true;
            } else {
                this.log(`Transition failed: ${transitionResult.error}`);
                return false;
            }

        } catch (error) {
            this.log(`Transition error: ${error.message}`);
            this.handleError(error);
            return false;
        }
    }

    /**
     * Check if a transition is allowed from current state
     * @param {string} targetStateName - Target state name
     * @returns {boolean} Whether transition is allowed
     */
    isTransitionAllowed(targetStateName) {
        return this.currentState.allowedTransitions.includes(targetStateName);
    }

    /**
     * Execute the actual state transition
     * @param {Object} newState - New state object
     * @param {Object} context - Transition context
     * @returns {Object} Transition result
     */
    executeTransition(newState, context) {
        try {
            // Exit current state
            this.exitState(context);

            // Record transition
            this.recordTransition(newState, context);

            // Enter new state
            this.enterState(newState, context);

            // Notify listeners
            this.notifyTransitionListeners(this.previousState, newState, context);

            return { success: true };

        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Enter a new state
     * @param {Object} state - State to enter
     * @param {Object} context - Entry context
     */
    enterState(state, context = {}) {
        this.previousState = this.currentState;
        this.currentState = state;
        this.stateData.entryTime = new Date();
        this.stateData.transitionCount++;

        // Apply state behaviors
        this.applyStateBehaviors(state, context);

        // Start monitoring if required
        this.startMonitoring();

        this.log(`Entered state: ${state.name}`);
    }

    /**
     * Exit current state
     * @param {Object} context - Exit context
     */
    exitState(context = {}) {
        if (this.currentState) {
            // Clean up state-specific resources
            this.cleanupStateBehaviors(this.currentState);
            
            // Stop monitoring
            this.stopMonitoring();

            this.log(`Exited state: ${this.currentState.name}`);
        }
    }

    /**
     * Apply behaviors for the current state
     * @param {Object} state - State object
     * @param {Object} context - Application context
     */
    applyStateBehaviors(state, context = {}) {
        const behaviors = state.behaviors;

        // Apply UI mode
        this.applyUIMode(behaviors.ui_mode);

        // Set monitoring frequency
        this.setMonitoringFrequency(behaviors.monitoring_frequency);

        // Set alert level
        this.setAlertLevel(behaviors.alert_level);

        // Configure available user actions
        this.configureUserActions(behaviors.user_actions);

        // Set data collection mode
        this.setDataCollectionMode(behaviors.data_collection);

        // Configure notifications
        if (behaviors.notifications) {
            this.configureNotifications(behaviors.notifications);
        }

        // Execute automatic actions
        if (behaviors.auto_actions) {
            this.executeAutoActions(behaviors.auto_actions, context);
        }

        // Call custom behavior handlers
        this.callBehaviorHandlers(state.name, behaviors, context);
    }

    /**
     * Clean up behaviors when exiting a state
     * @param {Object} state - State being exited
     */
    cleanupStateBehaviors(state) {
        // Stop any state-specific timers or processes
        if (this.transitionTimer) {
            clearTimeout(this.transitionTimer);
            this.transitionTimer = null;
        }

        // Call cleanup handlers
        if (this.behaviorHandlers[`${state.name}_cleanup`]) {
            this.behaviorHandlers[`${state.name}_cleanup`]();
        }
    }

    /**
     * Process risk assessment and determine appropriate state
     * @param {Object} riskAssessment - Risk assessment result
     * @returns {boolean} Whether a state transition occurred
     */
    processRiskAssessment(riskAssessment) {
        this.stateData.lastRiskAssessment = riskAssessment;

        // Determine target state based on risk level
        const targetState = this.determineStateFromRisk(riskAssessment);

        // Check if transition is needed
        if (targetState !== this.currentState.name) {
            return this.transition(targetState, { 
                reason: 'risk_assessment',
                riskAssessment: riskAssessment 
            });
        }

        return false;
    }

    /**
     * Determine appropriate state based on risk assessment
     * @param {Object} riskAssessment - Risk assessment result
     * @returns {string} Target state name
     */
    determineStateFromRisk(riskAssessment) {
        const riskLevel = riskAssessment.risk_level?.toUpperCase();
        const riskScore = riskAssessment.risk_score || 0;

        // Handle anomalies or critical conditions
        if (riskAssessment.anomalies_detected?.length > 0) {
            const criticalAnomalies = riskAssessment.anomalies_detected
                .filter(a => a.severity === 'CRITICAL');
            
            if (criticalAnomalies.length > 0) {
                return 'CRITICAL_RISK';
            }
        }

        // Standard risk level mapping
        switch (riskLevel) {
            case 'LOW':
                return 'LOW_RISK';
            case 'MEDIUM':
                return 'MEDIUM_RISK';
            case 'HIGH':
                return riskScore >= 8 ? 'CRITICAL_RISK' : 'HIGH_RISK';
            case 'CRITICAL':
                return 'CRITICAL_RISK';
            default:
                return 'MONITORING';
        }
    }

    /**
     * Handle emergency escalation
     * @param {Object} emergencyData - Emergency context data
     */
    handleEmergency(emergencyData = {}) {
        this.log('Emergency escalation triggered');
        
        // Force transition to emergency mode
        this.transition('EMERGENCY_MODE', {
            reason: 'emergency_escalation',
            emergency_data: emergencyData,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Handle recovery from emergency
     * @param {Object} recoveryData - Recovery context data
     */
    handleRecovery(recoveryData = {}) {
        this.log('Recovery initiated');
        
        this.transition('RECOVERY', {
            reason: 'emergency_recovery',
            recovery_data: recoveryData,
            timestamp: new Date().toISOString()
        });
    }

    /**
     * Behavior implementation methods
     */
    applyUIMode(uiMode) {
        if (this.behaviorHandlers.ui_mode) {
            this.behaviorHandlers.ui_mode(uiMode);
        } else {
            this.log(`UI Mode: ${uiMode}`);
        }
    }

    setMonitoringFrequency(frequency) {
        this.stateData.monitoringFrequency = frequency;
        this.log(`Monitoring frequency: ${frequency}ms`);
    }

    setAlertLevel(alertLevel) {
        if (this.behaviorHandlers.alert_level) {
            this.behaviorHandlers.alert_level(alertLevel);
        } else {
            this.log(`Alert level: ${alertLevel}`);
        }
    }

    configureUserActions(actions) {
        if (this.behaviorHandlers.user_actions) {
            this.behaviorHandlers.user_actions(actions);
        } else {
            this.log(`Available actions: ${actions.join(', ')}`);
        }
    }

    setDataCollectionMode(mode) {
        if (this.behaviorHandlers.data_collection) {
            this.behaviorHandlers.data_collection(mode);
        } else {
            this.log(`Data collection mode: ${mode}`);
        }
    }

    configureNotifications(notificationLevel) {
        if (this.behaviorHandlers.notifications) {
            this.behaviorHandlers.notifications(notificationLevel);
        } else {
            this.log(`Notification level: ${notificationLevel}`);
        }
    }

    executeAutoActions(actions, context) {
        for (const action of actions) {
            if (this.behaviorHandlers[`auto_${action}`]) {
                this.behaviorHandlers[`auto_${action}`](context);
            } else {
                this.log(`Auto action: ${action}`);
            }
        }
    }

    callBehaviorHandlers(stateName, behaviors, context) {
        const handlerName = `state_${stateName.toLowerCase()}`;
        if (this.behaviorHandlers[handlerName]) {
            this.behaviorHandlers[handlerName](behaviors, context);
        }
    }

    /**
     * Monitoring management
     */
    startMonitoring() {
        this.stopMonitoring(); // Clear any existing timer
        
        const frequency = this.stateData.monitoringFrequency;
        if (frequency > 0) {
            this.monitoringTimer = setInterval(() => {
                this.performMonitoringCycle();
            }, frequency);
        }
    }

    stopMonitoring() {
        if (this.monitoringTimer) {
            clearInterval(this.monitoringTimer);
            this.monitoringTimer = null;
        }
    }

    performMonitoringCycle() {
        if (this.behaviorHandlers.monitoring_cycle) {
            this.behaviorHandlers.monitoring_cycle(this.currentState);
        } else {
            this.log(`Monitoring cycle - State: ${this.currentState.name}`);
        }
    }

    /**
     * Event handling and listeners
     */
    addTransitionListener(listener) {
        this.transitionListeners.push(listener);
    }

    removeTransitionListener(listener) {
        const index = this.transitionListeners.indexOf(listener);
        if (index > -1) {
            this.transitionListeners.splice(index, 1);
        }
    }

    notifyTransitionListeners(fromState, toState, context) {
        for (const listener of this.transitionListeners) {
            try {
                listener({
                    from: fromState?.name,
                    to: toState.name,
                    context: context,
                    timestamp: new Date().toISOString()
                });
            } catch (error) {
                this.log(`Listener error: ${error.message}`);
            }
        }
    }

    /**
     * Behavior handler registration
     */
    registerBehaviorHandler(name, handler) {
        this.behaviorHandlers[name] = handler;
    }

    unregisterBehaviorHandler(name) {
        delete this.behaviorHandlers[name];
    }

    /**
     * State history and logging
     */
    recordTransition(newState, context) {
        const transition = {
            from: this.currentState?.name,
            to: newState.name,
            timestamp: new Date().toISOString(),
            context: context
        };

        this.stateHistory.push(transition);

        // Maintain history size limit
        if (this.stateHistory.length > this.config.maxStateHistory) {
            this.stateHistory = this.stateHistory.slice(-this.config.maxStateHistory);
        }
    }

    /**
     * Error handling
     */
    handleError(error) {
        this.log(`Error: ${error.message}`);
        
        // Transition to error state if not already there
        if (this.currentState.name !== 'ERROR') {
            this.transition('ERROR', {
                reason: 'error',
                error: error.message,
                timestamp: new Date().toISOString()
            });
        }
    }

    /**
     * Utility methods
     */
    getCurrentState() {
        return {
            name: this.currentState.name,
            description: this.currentState.description,
            behaviors: this.currentState.behaviors,
            entry_time: this.stateData.entryTime,
            duration: new Date() - this.stateData.entryTime
        };
    }

    getStateHistory() {
        return [...this.stateHistory];
    }

    getAvailableTransitions() {
        return this.currentState.allowedTransitions;
    }

    canTransitionTo(stateName) {
        return this.isTransitionAllowed(stateName);
    }

    getStateMachineStatus() {
        return {
            current_state: this.getCurrentState(),
            available_transitions: this.getAvailableTransitions(),
            transition_count: this.stateData.transitionCount,
            last_risk_assessment: this.stateData.lastRiskAssessment,
            monitoring_active: this.monitoringTimer !== null,
            monitoring_frequency: this.stateData.monitoringFrequency
        };
    }

    log(message) {
        if (this.config.enableLogging) {
            console.log(`[RiskStateMachine] ${new Date().toISOString()}: ${message}`);
        }
    }

    /**
     * Manual state control (for testing or emergency override)
     */
    forceTransition(stateName, context = {}) {
        const newState = this.states[stateName];
        if (!newState) {
            throw new Error(`Invalid state: ${stateName}`);
        }

        this.log(`Force transition to ${stateName}`);
        return this.executeTransition(newState, {
            ...context,
            forced: true,
            reason: 'manual_override'
        });
    }

    reset() {
        this.stopMonitoring();
        this.stateHistory = [];
        this.stateData.transitionCount = 0;
        this.currentState = this.states.INITIALIZING;
        this.previousState = null;
        this.initialize();
    }

    /**
     * State persistence (if enabled)
     */
    saveState() {
        if (this.config.persistState && typeof localStorage !== 'undefined') {
            const stateData = {
                currentState: this.currentState.name,
                stateHistory: this.stateHistory.slice(-10), // Save last 10 transitions
                transitionCount: this.stateData.transitionCount
            };
            localStorage.setItem('riskStateMachine', JSON.stringify(stateData));
        }
    }

    loadState() {
        if (this.config.persistState && typeof localStorage !== 'undefined') {
            const saved = localStorage.getItem('riskStateMachine');
            if (saved) {
                try {
                    const stateData = JSON.parse(saved);
                    this.currentState = this.states[stateData.currentState] || this.states.INITIALIZING;
                    this.stateHistory = stateData.stateHistory || [];
                    this.stateData.transitionCount = stateData.transitionCount || 0;
                } catch (error) {
                    this.log(`Failed to load saved state: ${error.message}`);
                }
            }
        }
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RiskStateMachine;
}

// Make available globally for browser use
if (typeof window !== 'undefined') {
    window.RiskStateMachine = RiskStateMachine;
}