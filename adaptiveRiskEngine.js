/**
 * Adaptive Risk Engine
 * Learns from past outcomes and adjusts risk sensitivity based on historical data
 */

class AdaptiveRiskEngine {
    constructor() {
        // Initial risk factor weights
        this.weights = {
            weather: 0.30,
            time: 0.20,
            crowd: 0.25,
            location: 0.15,
            visibility: 0.10
        };

        // Learning parameters
        this.learningRate = 0.05;
        this.adaptationThreshold = 5; // Minimum outcomes needed before adaptation
        this.maxWeightChange = 0.1; // Maximum weight change per adaptation
        this.confidenceDecay = 0.95; // How much to trust older outcomes

        // Historical data storage
        this.outcomeHistory = [];
        this.adaptationHistory = [];
        this.performanceMetrics = {
            totalPredictions: 0,
            correctPredictions: 0,
            falsePositives: 0,
            falseNegatives: 0,
            accuracy: 0
        };

        // Risk thresholds (adaptive)
        this.thresholds = {
            low_to_medium: 2.5,
            medium_to_high: 4.0
        };
    }

    /**
     * Main risk assessment with adaptive weights
     * @param {Object} conditions - Environmental conditions
     * @param {string} outcomeId - Unique identifier for tracking this prediction
     * @returns {Object} Risk assessment with adaptive scoring
     */
    assessRiskAdaptive(conditions, outcomeId = null) {
        try {
            // Calculate base risk scores for each factor
            const baseScores = this.calculateBaseScores(conditions);

            // Apply adaptive weights
            const weightedScore = this.applyAdaptiveWeights(baseScores);

            // Determine risk level using adaptive thresholds
            const riskLevel = this.determineAdaptiveRiskLevel(weightedScore);

            // Generate recommendations
            const recommendations = this.generateAdaptiveRecommendations(
                baseScores, 
                riskLevel, 
                conditions
            );

            // Create prediction record for learning
            const prediction = {
                id: outcomeId || this.generatePredictionId(),
                timestamp: new Date().toISOString(),
                conditions: conditions,
                base_scores: baseScores,
                weights_used: { ...this.weights },
                weighted_score: weightedScore,
                risk_level: riskLevel.level,
                thresholds_used: { ...this.thresholds },
                confidence: this.calculatePredictionConfidence(),
                awaiting_outcome: true
            };

            // Store prediction for future learning
            this.storePrediction(prediction);

            return {
                success: true,
                prediction_id: prediction.id,
                risk_assessment: {
                    risk_level: riskLevel.level,
                    risk_score: weightedScore,
                    confidence: prediction.confidence,
                    base_scores: baseScores,
                    adaptive_weights: this.weights,
                    thresholds: this.thresholds
                },
                recommendations: recommendations,
                learning_status: {
                    total_outcomes: this.outcomeHistory.length,
                    accuracy: this.performanceMetrics.accuracy,
                    last_adaptation: this.getLastAdaptationInfo()
                }
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Record actual outcome and trigger learning
     * @param {string} predictionId - ID of the original prediction
     * @param {Object} actualOutcome - What actually happened
     * @returns {Object} Learning results
     */
    recordOutcome(predictionId, actualOutcome) {
        try {
            // Find the original prediction
            const prediction = this.findPrediction(predictionId);
            if (!prediction) {
                throw new Error(`Prediction ${predictionId} not found`);
            }

            // Validate outcome data
            this.validateOutcome(actualOutcome);

            // Create outcome record
            const outcome = {
                prediction_id: predictionId,
                timestamp: new Date().toISOString(),
                actual_risk_level: actualOutcome.actual_risk_level,
                incident_occurred: actualOutcome.incident_occurred || false,
                incident_severity: actualOutcome.incident_severity || 0,
                user_feedback: actualOutcome.user_feedback || null,
                environmental_accuracy: actualOutcome.environmental_accuracy || 1.0
            };

            // Calculate prediction accuracy
            const accuracy = this.calculatePredictionAccuracy(prediction, outcome);

            // Add to outcome history
            this.outcomeHistory.push({
                ...outcome,
                prediction: prediction,
                accuracy: accuracy
            });

            // Update performance metrics
            this.updatePerformanceMetrics(prediction, outcome, accuracy);

            // Trigger adaptive learning if enough data
            let adaptationResult = null;
            if (this.shouldTriggerAdaptation()) {
                adaptationResult = this.performAdaptation();
            }

            return {
                success: true,
                outcome_recorded: true,
                accuracy: accuracy,
                performance_metrics: this.performanceMetrics,
                adaptation_triggered: adaptationResult !== null,
                adaptation_result: adaptationResult
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Calculate base risk scores for each environmental factor
     */
    calculateBaseScores(conditions) {
        const scores = {};

        // Weather scoring
        const weatherScores = {
            'clear': 0, 'sunny': 0, 'cloudy': 1, 'overcast': 1.5,
            'light_rain': 2, 'rainy': 3, 'heavy_rain': 4,
            'thunderstorm': 5, 'stormy': 5, 'foggy': 3,
            'snow': 3, 'blizzard': 5, 'tornado': 10, 'hurricane': 10
        };
        scores.weather = weatherScores[conditions.weather?.toLowerCase()] || 1;

        // Time scoring
        const timeScores = {
            'morning': 0, 'afternoon': 0, 'evening': 1,
            'night': 2, 'late_night': 3, 'dawn': 1
        };
        scores.time = timeScores[conditions.time?.toLowerCase()] || 0;

        // Crowd scoring
        const crowdScores = {
            'isolated': 2, 'light': 0, 'moderate': 1,
            'heavy': 2, 'overcrowded': 4, 'dangerous': 5
        };
        scores.crowd = crowdScores[conditions.crowd_density?.toLowerCase()] || 1;

        // Location scoring
        scores.location = this.calculateLocationScore(conditions.location);

        // Visibility scoring
        scores.visibility = this.calculateVisibilityScore(conditions.visibility);

        return scores;
    }

    /**
     * Calculate location-based risk score
     */
    calculateLocationScore(location) {
        if (!location) return 0;
        
        const locationStr = location.toLowerCase();
        let score = 0;

        if (locationStr.includes('construction') || locationStr.includes('industrial')) score += 2;
        if (locationStr.includes('remote') || locationStr.includes('isolated')) score += 1;
        if (locationStr.includes('water') || locationStr.includes('beach')) score += 1;
        if (locationStr.includes('mountain') || locationStr.includes('cliff')) score += 2;
        if (locationStr.includes('urban') || locationStr.includes('city')) score += 0.5;

        return Math.min(score, 5);
    }

    /**
     * Calculate visibility-based risk score
     */
    calculateVisibilityScore(visibility) {
        if (typeof visibility === 'number') {
            return Math.max(0, (1 - visibility) * 3); // Invert: low visibility = high risk
        }
        
        const visibilityScores = {
            'excellent': 0, 'good': 0, 'fair': 1,
            'poor': 2, 'very_poor': 3, 'zero': 4
        };
        
        return visibilityScores[visibility?.toLowerCase()] || 1;
    }

    /**
     * Apply adaptive weights to base scores
     */
    applyAdaptiveWeights(baseScores) {
        let weightedScore = 0;
        
        for (const [factor, score] of Object.entries(baseScores)) {
            const weight = this.weights[factor] || 0;
            weightedScore += score * weight;
        }

        return Math.round(weightedScore * 10) / 10;
    }

    /**
     * Determine risk level using adaptive thresholds
     */
    determineAdaptiveRiskLevel(score) {
        if (score >= this.thresholds.medium_to_high) {
            return {
                level: 'HIGH',
                color: '#dc2626',
                description: 'High risk conditions detected'
            };
        } else if (score >= this.thresholds.low_to_medium) {
            return {
                level: 'MEDIUM',
                color: '#d97706',
                description: 'Moderate risk conditions'
            };
        } else {
            return {
                level: 'LOW',
                color: '#16a34a',
                description: 'Low risk conditions'
            };
        }
    }

    /**
     * Calculate prediction confidence based on historical performance
     */
    calculatePredictionConfidence() {
        if (this.outcomeHistory.length < 3) {
            return 0.7; // Default confidence for new system
        }

        // Base confidence on recent accuracy
        const recentOutcomes = this.outcomeHistory.slice(-10);
        const recentAccuracy = recentOutcomes.reduce((sum, outcome) => 
            sum + outcome.accuracy, 0) / recentOutcomes.length;

        // Adjust for data volume
        const dataVolumeBonus = Math.min(0.2, this.outcomeHistory.length * 0.01);

        return Math.min(0.95, Math.max(0.3, recentAccuracy + dataVolumeBonus));
    }

    /**
     * Calculate accuracy of a prediction against actual outcome
     */
    calculatePredictionAccuracy(prediction, outcome) {
        let accuracy = 0;

        // Risk level accuracy (primary metric)
        if (prediction.risk_level === outcome.actual_risk_level) {
            accuracy += 0.6; // 60% weight for correct risk level
        } else {
            // Partial credit for being close
            const levelMap = { 'LOW': 0, 'MEDIUM': 1, 'HIGH': 2 };
            const predictedLevel = levelMap[prediction.risk_level] || 1;
            const actualLevel = levelMap[outcome.actual_risk_level] || 1;
            const levelDiff = Math.abs(predictedLevel - actualLevel);
            accuracy += Math.max(0, 0.6 - (levelDiff * 0.3));
        }

        // Incident prediction accuracy
        const predictedIncidentRisk = prediction.risk_level === 'HIGH' ? 1 : 0;
        const actualIncident = outcome.incident_occurred ? 1 : 0;
        
        if (predictedIncidentRisk === actualIncident) {
            accuracy += 0.3; // 30% weight for incident prediction
        }

        // Environmental accuracy bonus
        accuracy += (outcome.environmental_accuracy || 1.0) * 0.1;

        return Math.min(1.0, accuracy);
    }

    /**
     * Update performance metrics
     */
    updatePerformanceMetrics(prediction, outcome, accuracy) {
        this.performanceMetrics.totalPredictions++;
        
        if (accuracy >= 0.7) {
            this.performanceMetrics.correctPredictions++;
        }

        // Track false positives/negatives
        if (prediction.risk_level === 'HIGH' && !outcome.incident_occurred) {
            this.performanceMetrics.falsePositives++;
        }
        
        if (prediction.risk_level !== 'HIGH' && outcome.incident_occurred) {
            this.performanceMetrics.falseNegatives++;
        }

        // Update overall accuracy
        this.performanceMetrics.accuracy = 
            this.performanceMetrics.correctPredictions / this.performanceMetrics.totalPredictions;
    }

    /**
     * Check if adaptation should be triggered
     */
    shouldTriggerAdaptation() {
        return this.outcomeHistory.length >= this.adaptationThreshold &&
               this.outcomeHistory.length % this.adaptationThreshold === 0;
    }

    /**
     * Perform adaptive weight adjustment
     */
    performAdaptation() {
        const recentOutcomes = this.outcomeHistory.slice(-this.adaptationThreshold * 2);
        const weightAdjustments = {};

        // Analyze performance by factor
        for (const factor of Object.keys(this.weights)) {
            const factorPerformance = this.analyzeFactor Performance(factor, recentOutcomes);
            weightAdjustments[factor] = this.calculateWeightAdjustment(factorPerformance);
        }

        // Apply weight adjustments
        const oldWeights = { ...this.weights };
        this.applyWeightAdjustments(weightAdjustments);

        // Adjust thresholds if needed
        const thresholdAdjustments = this.calculateThresholdAdjustments(recentOutcomes);
        this.applyThresholdAdjustments(thresholdAdjustments);

        // Record adaptation
        const adaptation = {
            timestamp: new Date().toISOString(),
            old_weights: oldWeights,
            new_weights: { ...this.weights },
            weight_adjustments: weightAdjustments,
            threshold_adjustments: thresholdAdjustments,
            outcomes_analyzed: recentOutcomes.length,
            trigger_reason: 'scheduled_adaptation'
        };

        this.adaptationHistory.push(adaptation);

        return adaptation;
    }

    /**
     * Analyze performance of a specific factor
     */
    analyzeFactorPerformance(factor, outcomes) {
        let correctPredictions = 0;
        let totalWeight = 0;

        for (const outcome of outcomes) {
            const prediction = outcome.prediction;
            const factorScore = prediction.base_scores[factor] || 0;
            const factorWeight = prediction.weights_used[factor] || 0;
            
            // Weight by recency and confidence
            const age = (new Date() - new Date(outcome.timestamp)) / (1000 * 60 * 60 * 24);
            const recencyWeight = Math.pow(this.confidenceDecay, age);
            
            totalWeight += recencyWeight;
            
            // Factor contributed correctly if high score correlated with high risk
            if ((factorScore >= 2 && outcome.actual_risk_level !== 'LOW') ||
                (factorScore < 2 && outcome.actual_risk_level === 'LOW')) {
                correctPredictions += recencyWeight;
            }
        }

        return totalWeight > 0 ? correctPredictions / totalWeight : 0.5;
    }

    /**
     * Calculate weight adjustment for a factor
     */
    calculateWeightAdjustment(performance) {
        // Increase weight if performance is good, decrease if poor
        const targetPerformance = 0.7;
        const performanceDiff = performance - targetPerformance;
        
        return Math.max(-this.maxWeightChange, 
               Math.min(this.maxWeightChange, 
                       performanceDiff * this.learningRate));
    }

    /**
     * Apply weight adjustments while maintaining normalization
     */
    applyWeightAdjustments(adjustments) {
        // Apply adjustments
        for (const [factor, adjustment] of Object.entries(adjustments)) {
            this.weights[factor] = Math.max(0.05, 
                Math.min(0.5, this.weights[factor] + adjustment));
        }

        // Normalize weights to sum to 1.0
        const totalWeight = Object.values(this.weights).reduce((sum, w) => sum + w, 0);
        for (const factor of Object.keys(this.weights)) {
            this.weights[factor] /= totalWeight;
        }
    }

    /**
     * Calculate threshold adjustments based on false positive/negative rates
     */
    calculateThresholdAdjustments(outcomes) {
        const adjustments = {};
        
        // Analyze false positive rate (predicted high, actual low)
        const falsePositives = outcomes.filter(o => 
            o.prediction.risk_level === 'HIGH' && o.actual_risk_level !== 'HIGH').length;
        const highPredictions = outcomes.filter(o => 
            o.prediction.risk_level === 'HIGH').length;
        
        const falsePositiveRate = highPredictions > 0 ? falsePositives / highPredictions : 0;
        
        // Adjust thresholds based on false positive rate
        if (falsePositiveRate > 0.3) {
            // Too many false positives, raise thresholds
            adjustments.medium_to_high = 0.2;
            adjustments.low_to_medium = 0.1;
        } else if (falsePositiveRate < 0.1) {
            // Too few high risk predictions, lower thresholds
            adjustments.medium_to_high = -0.1;
            adjustments.low_to_medium = -0.05;
        }

        return adjustments;
    }

    /**
     * Apply threshold adjustments
     */
    applyThresholdAdjustments(adjustments) {
        for (const [threshold, adjustment] of Object.entries(adjustments)) {
            if (this.thresholds[threshold] !== undefined) {
                this.thresholds[threshold] = Math.max(1.0, 
                    Math.min(6.0, this.thresholds[threshold] + adjustment));
            }
        }
    }

    /**
     * Generate adaptive recommendations
     */
    generateAdaptiveRecommendations(baseScores, riskLevel, conditions) {
        const recommendations = [];

        // Base recommendations
        if (riskLevel.level === 'HIGH') {
            recommendations.push('High risk detected - take immediate precautions');
        } else if (riskLevel.level === 'MEDIUM') {
            recommendations.push('Moderate risk - stay alert and prepared');
        } else {
            recommendations.push('Low risk - maintain basic awareness');
        }

        // Factor-specific recommendations based on highest scoring factors
        const sortedFactors = Object.entries(baseScores)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 2);

        for (const [factor, score] of sortedFactors) {
            if (score >= 2) {
                recommendations.push(...this.getFactorRecommendations(factor, score, conditions));
            }
        }

        // Adaptive recommendations based on learning
        if (this.performanceMetrics.falsePositives > this.performanceMetrics.falseNegatives) {
            recommendations.push('System tends toward caution - verify conditions independently');
        }

        return recommendations;
    }

    /**
     * Get factor-specific recommendations
     */
    getFactorRecommendations(factor, score, conditions) {
        const recommendations = [];

        switch (factor) {
            case 'weather':
                if (score >= 4) recommendations.push('Severe weather - seek immediate shelter');
                else if (score >= 2) recommendations.push('Monitor weather conditions closely');
                break;
            case 'crowd':
                if (score >= 3) recommendations.push('Avoid crowded areas or identify exit routes');
                else if (score >= 2) recommendations.push('Stay aware in crowded conditions');
                break;
            case 'time':
                if (score >= 2) recommendations.push('Use additional lighting and stay in populated areas');
                break;
            case 'location':
                if (score >= 2) recommendations.push('Exercise extra caution in this location type');
                break;
            case 'visibility':
                if (score >= 2) recommendations.push('Improve visibility with lights or reflective gear');
                break;
        }

        return recommendations;
    }

    /**
     * Utility functions
     */
    generatePredictionId() {
        return 'pred_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    storePrediction(prediction) {
        // In a real implementation, this would store to a database
        // For now, we'll keep recent predictions in memory
        if (!this.recentPredictions) this.recentPredictions = [];
        this.recentPredictions.push(prediction);
        
        // Keep only last 100 predictions in memory
        if (this.recentPredictions.length > 100) {
            this.recentPredictions = this.recentPredictions.slice(-100);
        }
    }

    findPrediction(predictionId) {
        return this.recentPredictions?.find(p => p.id === predictionId) || null;
    }

    validateOutcome(outcome) {
        const validRiskLevels = ['LOW', 'MEDIUM', 'HIGH'];
        if (!validRiskLevels.includes(outcome.actual_risk_level)) {
            throw new Error('Invalid actual_risk_level. Must be LOW, MEDIUM, or HIGH');
        }
    }

    getLastAdaptationInfo() {
        if (this.adaptationHistory.length === 0) {
            return { never_adapted: true };
        }
        
        const lastAdaptation = this.adaptationHistory[this.adaptationHistory.length - 1];
        return {
            timestamp: lastAdaptation.timestamp,
            outcomes_since: this.outcomeHistory.length % this.adaptationThreshold
        };
    }

    /**
     * Get system learning statistics
     */
    getLearningStats() {
        return {
            current_weights: this.weights,
            current_thresholds: this.thresholds,
            performance_metrics: this.performanceMetrics,
            total_adaptations: this.adaptationHistory.length,
            learning_rate: this.learningRate,
            confidence: this.calculatePredictionConfidence()
        };
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdaptiveRiskEngine;
}

// Make available globally for browser use
if (typeof window !== 'undefined') {
    window.AdaptiveRiskEngine = AdaptiveRiskEngine;
}