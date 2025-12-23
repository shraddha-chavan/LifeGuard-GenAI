/**
 * Micro-Decision Engine
 * Updates risk confidence as preventive steps are completed
 */

class MicroDecisionEngine {
    constructor(options = {}) {
        // Configuration
        this.config = {
            baseConfidence: options.baseConfidence || 0.5,
            maxConfidence: options.maxConfidence || 0.95,
            minConfidence: options.minConfidence || 0.1,
            decayRate: options.decayRate || 0.02, // Confidence decay per minute
            completionBonus: options.completionBonus || 0.15,
            timeWeightFactor: options.timeWeightFactor || 0.8,
            enableLogging: options.enableLogging || true
        };

        // Preventive step definitions with impact weights
        this.preventiveSteps = {
            // Environmental steps
            'seek_shelter': {
                category: 'environmental',
                impact_weight: 0.25,
                time_sensitivity: 'immediate', // immediate, urgent, moderate, low
                effectiveness_duration: 30, // minutes
                risk_reduction: 0.3,
                confidence_boost: 0.2
            },
            'monitor_weather': {
                category: 'environmental',
                impact_weight: 0.15,
                time_sensitivity: 'moderate',
                effectiveness_duration: 15,
                risk_reduction: 0.1,
                confidence_boost: 0.1
            },
            'avoid_hazardous_areas': {
                category: 'environmental',
                impact_weight: 0.2,
                time_sensitivity: 'urgent',
                effectiveness_duration: 60,
                risk_reduction: 0.25,
                confidence_boost: 0.15
            },

            // Communication steps
            'contact_emergency_services': {
                category: 'communication',
                impact_weight: 0.3,
                time_sensitivity: 'immediate',
                effectiveness_duration: 120,
                risk_reduction: 0.4,
                confidence_boost: 0.25
            },
            'notify_contacts': {
                category: 'communication',
                impact_weight: 0.2,
                time_sensitivity: 'urgent',
                effectiveness_duration: 90,
                risk_reduction: 0.15,
                confidence_boost: 0.15
            },
            'share_location': {
                category: 'communication',
                impact_weight: 0.15,
                time_sensitivity: 'moderate',
                effectiveness_duration: 60,
                risk_reduction: 0.1,
                confidence_boost: 0.1
            },

            // Safety equipment steps
            'use_safety_equipment': {
                category: 'equipment',
                impact_weight: 0.25,
                time_sensitivity: 'urgent',
                effectiveness_duration: 180,
                risk_reduction: 0.3,
                confidence_boost: 0.2
            },
            'check_equipment': {
                category: 'equipment',
                impact_weight: 0.1,
                time_sensitivity: 'low',
                effectiveness_duration: 30,
                risk_reduction: 0.05,
                confidence_boost: 0.05
            },

            // Movement steps
            'evacuate_area': {
                category: 'movement',
                impact_weight: 0.35,
                time_sensitivity: 'immediate',
                effectiveness_duration: 240,
                risk_reduction: 0.5,
                confidence_boost: 0.3
            },
            'move_to_safety': {
                category: 'movement',
                impact_weight: 0.25,
                time_sensitivity: 'urgent',
                effectiveness_duration: 120,
                risk_reduction: 0.3,
                confidence_boost: 0.2
            },
            'stay_in_groups': {
                category: 'movement',
                impact_weight: 0.15,
                time_sensitivity: 'moderate',
                effectiveness_duration: 90,
                risk_reduction: 0.15,
                confidence_boost: 0.1
            },

            // Monitoring steps
            'continuous_monitoring': {
                category: 'monitoring',
                impact_weight: 0.2,
                time_sensitivity: 'moderate',
                effectiveness_duration: 45,
                risk_reduction: 0.2,
                confidence_boost: 0.15
            },
            'situational_awareness': {
                category: 'monitoring',
                impact_weight: 0.15,
                time_sensitivity: 'low',
                effectiveness_duration: 60,
                risk_reduction: 0.1,
                confidence_boost: 0.1
            }
        };

        // Current state
        this.currentConfidence = this.config.baseConfidence;
        this.completedSteps = new Map();
        this.activeSteps = new Map();
        this.stepHistory = [];
        this.confidenceHistory = [];

        // Timers and intervals
        this.decayTimer = null;
        this.monitoringTimer = null;

        // Decision context
        this.decisionContext = {
            currentRiskLevel: 'UNKNOWN',
            lastRiskAssessment: null,
            environmentalFactors: {},
            userLocation: null,
            timeOfLastUpdate: new Date()
        };

        // Initialize
        this.initialize();
    }

    /**
     * Initialize the micro-decision engine
     */
    initialize() {
        this.log('Micro-decision engine initializing...');
        
        // Start confidence decay timer
        this.startConfidenceDecay();
        
        // Record initial confidence
        this.recordConfidenceSnapshot('initialization');
    }

    /**
     * Update the decision context with new risk assessment
     * @param {Object} riskAssessment - Current risk assessment
     * @param {Object} environmentalData - Environmental context
     */
    updateContext(riskAssessment, environmentalData = {}) {
        this.decisionContext.lastRiskAssessment = riskAssessment;
        this.decisionContext.currentRiskLevel = riskAssessment.risk_level || 'UNKNOWN';
        this.decisionContext.environmentalFactors = environmentalData;
        this.decisionContext.timeOfLastUpdate = new Date();

        // Adjust base confidence based on risk level
        this.adjustBaseConfidence(riskAssessment);

        this.log(`Context updated - Risk: ${this.decisionContext.currentRiskLevel}, Confidence: ${this.currentConfidence.toFixed(3)}`);
    }

    /**
     * Record completion of a preventive step
     * @param {string} stepId - ID of the completed step
     * @param {Object} completionData - Additional completion context
     * @returns {Object} Updated confidence and decision result
     */
    completePreventiveStep(stepId, completionData = {}) {
        try {
            const step = this.preventiveSteps[stepId];
            if (!step) {
                throw new Error(`Unknown preventive step: ${stepId}`);
            }

            // Record step completion
            const completion = {
                stepId: stepId,
                timestamp: new Date(),
                completionData: completionData,
                step: step,
                previousConfidence: this.currentConfidence
            };

            // Calculate confidence boost
            const confidenceBoost = this.calculateConfidenceBoost(step, completionData);

            // Apply confidence boost
            this.applyConfidenceBoost(confidenceBoost, completion);

            // Record completed step
            this.completedSteps.set(stepId, completion);
            this.stepHistory.push(completion);

            // Remove from active steps if it was there
            this.activeSteps.delete(stepId);

            // Calculate new risk assessment
            const updatedAssessment = this.calculateUpdatedRiskAssessment();

            // Generate micro-decisions
            const microDecisions = this.generateMicroDecisions(completion, updatedAssessment);

            // Record confidence snapshot
            this.recordConfidenceSnapshot('step_completion', {
                stepId: stepId,
                confidenceBoost: confidenceBoost
            });

            const result = {
                success: true,
                stepId: stepId,
                previousConfidence: completion.previousConfidence,
                newConfidence: this.currentConfidence,
                confidenceBoost: confidenceBoost,
                updatedRiskAssessment: updatedAssessment,
                microDecisions: microDecisions,
                completionTimestamp: completion.timestamp
            };

            this.log(`Step completed: ${stepId}, Confidence: ${completion.previousConfidence.toFixed(3)} → ${this.currentConfidence.toFixed(3)}`);

            return result;

        } catch (error) {
            this.log(`Error completing step ${stepId}: ${error.message}`);
            return {
                success: false,
                error: error.message,
                stepId: stepId
            };
        }
    }

    /**
     * Mark a preventive step as started/in-progress
     * @param {string} stepId - ID of the step being started
     * @param {Object} startData - Additional start context
     */
    startPreventiveStep(stepId, startData = {}) {
        const step = this.preventiveSteps[stepId];
        if (!step) {
            this.log(`Unknown preventive step: ${stepId}`);
            return false;
        }

        const activeStep = {
            stepId: stepId,
            startTime: new Date(),
            step: step,
            startData: startData,
            expectedCompletion: new Date(Date.now() + (step.effectiveness_duration * 60000))
        };

        this.activeSteps.set(stepId, activeStep);
        this.log(`Step started: ${stepId}`);

        return true;
    }

    /**
     * Calculate confidence boost for a completed step
     * @param {Object} step - Step definition
     * @param {Object} completionData - Completion context
     * @returns {number} Confidence boost amount
     */
    calculateConfidenceBoost(step, completionData) {
        let boost = step.confidence_boost;

        // Time sensitivity bonus
        const timeSensitivityMultiplier = this.getTimeSensitivityMultiplier(step.time_sensitivity);
        boost *= timeSensitivityMultiplier;

        // Quality of completion bonus
        const qualityMultiplier = this.getQualityMultiplier(completionData);
        boost *= qualityMultiplier;

        // Risk level context adjustment
        const riskLevelMultiplier = this.getRiskLevelMultiplier();
        boost *= riskLevelMultiplier;

        // Diminishing returns for repeated steps
        const repetitionPenalty = this.getRepetitionPenalty(step);
        boost *= repetitionPenalty;

        return Math.min(boost, 0.3); // Cap maximum boost
    }

    /**
     * Apply confidence boost with bounds checking
     * @param {number} boost - Confidence boost amount
     * @param {Object} completion - Completion record
     */
    applyConfidenceBoost(boost, completion) {
        const oldConfidence = this.currentConfidence;
        this.currentConfidence = Math.min(
            this.config.maxConfidence,
            Math.max(
                this.config.minConfidence,
                this.currentConfidence + boost
            )
        );

        completion.confidenceBoost = boost;
        completion.newConfidence = this.currentConfidence;
    }

    /**
     * Calculate updated risk assessment based on completed steps
     * @returns {Object} Updated risk assessment
     */
    calculateUpdatedRiskAssessment() {
        if (!this.decisionContext.lastRiskAssessment) {
            return null;
        }

        const originalAssessment = this.decisionContext.lastRiskAssessment;
        let riskReduction = 0;

        // Calculate total risk reduction from completed steps
        for (const [stepId, completion] of this.completedSteps) {
            const step = completion.step;
            const timeElapsed = (new Date() - completion.timestamp) / (1000 * 60); // minutes
            
            // Apply time decay to effectiveness
            if (timeElapsed < step.effectiveness_duration) {
                const effectiveness = 1 - (timeElapsed / step.effectiveness_duration);
                riskReduction += step.risk_reduction * effectiveness * step.impact_weight;
            }
        }

        // Calculate new risk score
        const originalScore = originalAssessment.risk_score || 0;
        const newScore = Math.max(0, originalScore * (1 - riskReduction));

        // Determine new risk level
        const newRiskLevel = this.determineRiskLevel(newScore);

        return {
            original_risk_score: originalScore,
            adjusted_risk_score: newScore,
            risk_reduction: riskReduction,
            original_risk_level: originalAssessment.risk_level,
            adjusted_risk_level: newRiskLevel,
            confidence: this.currentConfidence,
            steps_completed: Array.from(this.completedSteps.keys()),
            assessment_timestamp: new Date().toISOString()
        };
    }

    /**
     * Generate micro-decisions based on step completion
     * @param {Object} completion - Step completion record
     * @param {Object} updatedAssessment - Updated risk assessment
     * @returns {Array} Array of micro-decisions
     */
    generateMicroDecisions(completion, updatedAssessment) {
        const decisions = [];
        const step = completion.step;

        // Decision: Continue current approach
        if (this.currentConfidence > 0.7) {
            decisions.push({
                type: 'continue',
                confidence: 0.8,
                recommendation: 'Current preventive measures are effective - continue approach',
                reasoning: `High confidence (${this.currentConfidence.toFixed(2)}) indicates good progress`
            });
        }

        // Decision: Escalate precautions
        if (updatedAssessment && updatedAssessment.adjusted_risk_score > 3 && this.currentConfidence < 0.6) {
            decisions.push({
                type: 'escalate',
                confidence: 0.7,
                recommendation: 'Consider additional preventive measures',
                reasoning: 'Risk remains elevated despite completed steps',
                suggested_steps: this.suggestAdditionalSteps(step.category)
            });
        }

        // Decision: Maintain vigilance
        if (step.time_sensitivity === 'immediate' && this.currentConfidence > 0.6) {
            decisions.push({
                type: 'maintain',
                confidence: 0.75,
                recommendation: 'Maintain current safety posture and monitor conditions',
                reasoning: 'Critical step completed successfully'
            });
        }

        // Decision: Prepare for next phase
        if (this.getCompletionRate() > 0.7) {
            decisions.push({
                type: 'prepare',
                confidence: 0.8,
                recommendation: 'Prepare for transition to next safety phase',
                reasoning: 'High completion rate of preventive measures',
                next_phase_steps: this.suggestNextPhaseSteps()
            });
        }

        // Decision: Seek additional help
        if (this.currentConfidence < 0.4 && this.getCompletionRate() > 0.5) {
            decisions.push({
                type: 'seek_help',
                confidence: 0.6,
                recommendation: 'Consider seeking additional assistance',
                reasoning: 'Low confidence despite completing multiple steps'
            });
        }

        return decisions;
    }

    /**
     * Get recommended next steps based on current context
     * @param {string} riskLevel - Current risk level
     * @returns {Array} Array of recommended step IDs
     */
    getRecommendedSteps(riskLevel = null) {
        const currentRisk = riskLevel || this.decisionContext.currentRiskLevel;
        const completedStepIds = Array.from(this.completedSteps.keys());
        
        // Filter out already completed steps
        const availableSteps = Object.entries(this.preventiveSteps)
            .filter(([stepId, step]) => !completedStepIds.includes(stepId))
            .map(([stepId, step]) => ({ stepId, ...step }));

        // Sort by priority based on risk level and time sensitivity
        const prioritizedSteps = availableSteps.sort((a, b) => {
            const aPriority = this.calculateStepPriority(a, currentRisk);
            const bPriority = this.calculateStepPriority(b, currentRisk);
            return bPriority - aPriority;
        });

        return prioritizedSteps.slice(0, 5).map(step => ({
            stepId: step.stepId,
            priority: this.calculateStepPriority(step, currentRisk),
            category: step.category,
            time_sensitivity: step.time_sensitivity,
            expected_confidence_boost: step.confidence_boost
        }));
    }

    /**
     * Calculate priority score for a step
     * @param {Object} step - Step definition
     * @param {string} riskLevel - Current risk level
     * @returns {number} Priority score
     */
    calculateStepPriority(step, riskLevel) {
        let priority = step.impact_weight;

        // Risk level multiplier
        const riskMultipliers = {
            'LOW': 0.5,
            'MEDIUM': 1.0,
            'HIGH': 1.5,
            'CRITICAL': 2.0
        };
        priority *= (riskMultipliers[riskLevel] || 1.0);

        // Time sensitivity multiplier
        const timeMultipliers = {
            'immediate': 2.0,
            'urgent': 1.5,
            'moderate': 1.0,
            'low': 0.7
        };
        priority *= (timeMultipliers[step.time_sensitivity] || 1.0);

        // Category balance (prefer diverse categories)
        const categoryCount = this.getCategoryCompletionCount(step.category);
        if (categoryCount > 2) {
            priority *= 0.8; // Slight penalty for over-representation
        }

        return priority;
    }

    /**
     * Helper methods for confidence calculations
     */
    getTimeSensitivityMultiplier(timeSensitivity) {
        const multipliers = {
            'immediate': 1.3,
            'urgent': 1.2,
            'moderate': 1.0,
            'low': 0.9
        };
        return multipliers[timeSensitivity] || 1.0;
    }

    getQualityMultiplier(completionData) {
        // Quality indicators from completion data
        let quality = 1.0;
        
        if (completionData.thoroughness === 'high') quality *= 1.2;
        if (completionData.speed === 'fast') quality *= 1.1;
        if (completionData.verification === 'confirmed') quality *= 1.15;
        
        return Math.min(quality, 1.5); // Cap at 1.5x
    }

    getRiskLevelMultiplier() {
        const multipliers = {
            'LOW': 0.8,
            'MEDIUM': 1.0,
            'HIGH': 1.3,
            'CRITICAL': 1.5
        };
        return multipliers[this.decisionContext.currentRiskLevel] || 1.0;
    }

    getRepetitionPenalty(step) {
        const completionCount = Array.from(this.completedSteps.values())
            .filter(completion => completion.step.category === step.category).length;
        
        return Math.max(0.5, 1.0 - (completionCount * 0.1));
    }

    determineRiskLevel(score) {
        if (score >= 4) return 'CRITICAL';
        if (score >= 3) return 'HIGH';
        if (score >= 2) return 'MEDIUM';
        return 'LOW';
    }

    getCompletionRate() {
        const recommendedSteps = this.getRecommendedSteps();
        const totalRecommended = recommendedSteps.length + this.completedSteps.size;
        return totalRecommended > 0 ? this.completedSteps.size / totalRecommended : 0;
    }

    getCategoryCompletionCount(category) {
        return Array.from(this.completedSteps.values())
            .filter(completion => completion.step.category === category).length;
    }

    suggestAdditionalSteps(currentCategory) {
        return this.getRecommendedSteps()
            .filter(step => step.category !== currentCategory)
            .slice(0, 3)
            .map(step => step.stepId);
    }

    suggestNextPhaseSteps() {
        // Suggest monitoring and recovery steps
        return ['continuous_monitoring', 'situational_awareness', 'check_equipment'];
    }

    /**
     * Confidence decay management
     */
    startConfidenceDecay() {
        this.stopConfidenceDecay();
        
        this.decayTimer = setInterval(() => {
            this.applyConfidenceDecay();
        }, 60000); // Every minute
    }

    stopConfidenceDecay() {
        if (this.decayTimer) {
            clearInterval(this.decayTimer);
            this.decayTimer = null;
        }
    }

    applyConfidenceDecay() {
        const oldConfidence = this.currentConfidence;
        
        // Apply base decay
        this.currentConfidence = Math.max(
            this.config.minConfidence,
            this.currentConfidence - this.config.decayRate
        );

        // Apply step effectiveness decay
        this.applyStepEffectivenessDecay();

        if (oldConfidence !== this.currentConfidence) {
            this.recordConfidenceSnapshot('decay');
        }
    }

    applyStepEffectivenessDecay() {
        const now = new Date();
        
        for (const [stepId, completion] of this.completedSteps) {
            const timeElapsed = (now - completion.timestamp) / (1000 * 60); // minutes
            
            if (timeElapsed > completion.step.effectiveness_duration) {
                // Step effectiveness has expired
                this.completedSteps.delete(stepId);
                this.log(`Step effectiveness expired: ${stepId}`);
            }
        }
    }

    adjustBaseConfidence(riskAssessment) {
        // Adjust base confidence based on risk assessment confidence
        if (riskAssessment.confidence) {
            const assessmentConfidence = riskAssessment.confidence;
            this.currentConfidence = (this.currentConfidence * 0.7) + (assessmentConfidence * 0.3);
        }
    }

    /**
     * History and logging
     */
    recordConfidenceSnapshot(reason, metadata = {}) {
        const snapshot = {
            timestamp: new Date().toISOString(),
            confidence: this.currentConfidence,
            reason: reason,
            metadata: metadata,
            completedSteps: this.completedSteps.size,
            activeSteps: this.activeSteps.size
        };

        this.confidenceHistory.push(snapshot);

        // Maintain history size
        if (this.confidenceHistory.length > 100) {
            this.confidenceHistory = this.confidenceHistory.slice(-100);
        }
    }

    /**
     * Status and reporting methods
     */
    getEngineStatus() {
        return {
            currentConfidence: this.currentConfidence,
            completedSteps: Array.from(this.completedSteps.keys()),
            activeSteps: Array.from(this.activeSteps.keys()),
            completionRate: this.getCompletionRate(),
            riskLevel: this.decisionContext.currentRiskLevel,
            recommendedSteps: this.getRecommendedSteps(),
            lastUpdate: this.decisionContext.timeOfLastUpdate
        };
    }

    getConfidenceHistory() {
        return [...this.confidenceHistory];
    }

    getStepHistory() {
        return [...this.stepHistory];
    }

    getDetailedAnalysis() {
        const updatedAssessment = this.calculateUpdatedRiskAssessment();
        
        return {
            confidence_analysis: {
                current: this.currentConfidence,
                trend: this.calculateConfidenceTrend(),
                factors: this.analyzeConfidenceFactors()
            },
            step_analysis: {
                completed: this.completedSteps.size,
                active: this.activeSteps.size,
                completion_rate: this.getCompletionRate(),
                category_breakdown: this.getCategoryBreakdown()
            },
            risk_analysis: updatedAssessment,
            recommendations: this.getRecommendedSteps()
        };
    }

    calculateConfidenceTrend() {
        if (this.confidenceHistory.length < 2) return 'stable';
        
        const recent = this.confidenceHistory.slice(-5);
        const trend = recent[recent.length - 1].confidence - recent[0].confidence;
        
        if (trend > 0.05) return 'increasing';
        if (trend < -0.05) return 'decreasing';
        return 'stable';
    }

    analyzeConfidenceFactors() {
        const factors = [];
        
        if (this.completedSteps.size > 0) {
            factors.push({
                factor: 'completed_steps',
                impact: 'positive',
                strength: this.completedSteps.size * 0.1
            });
        }
        
        if (this.decisionContext.currentRiskLevel === 'HIGH' || this.decisionContext.currentRiskLevel === 'CRITICAL') {
            factors.push({
                factor: 'high_risk_environment',
                impact: 'negative',
                strength: 0.2
            });
        }
        
        return factors;
    }

    getCategoryBreakdown() {
        const breakdown = {};
        
        for (const [stepId, completion] of this.completedSteps) {
            const category = completion.step.category;
            breakdown[category] = (breakdown[category] || 0) + 1;
        }
        
        return breakdown;
    }

    log(message) {
        if (this.config.enableLogging) {
            console.log(`[MicroDecisionEngine] ${new Date().toISOString()}: ${message}`);
        }
    }

    /**
     * Reset and cleanup
     */
    reset() {
        this.stopConfidenceDecay();
        this.currentConfidence = this.config.baseConfidence;
        this.completedSteps.clear();
        this.activeSteps.clear();
        this.stepHistory = [];
        this.confidenceHistory = [];
        this.initialize();
    }

    cleanup() {
        this.stopConfidenceDecay();
        if (this.monitoringTimer) {
            clearInterval(this.monitoringTimer);
        }
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MicroDecisionEngine;
}

// Make available globally for browser use
if (typeof window !== 'undefined') {
    window.MicroDecisionEngine = MicroDecisionEngine;
}