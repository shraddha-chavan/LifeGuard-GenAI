/**
 * Risk Breakdown Analyzer
 * Generates detailed contribution percentages of each factor to the final risk decision
 */

class RiskBreakdownAnalyzer {
    constructor(options = {}) {
        // Configuration for analysis
        this.config = {
            includeSubFactors: options.includeSubFactors || true,
            showConfidenceIntervals: options.showConfidenceIntervals || true,
            detailedExplanations: options.detailedExplanations || true,
            visualizationData: options.visualizationData || true
        };

        // Default factor weights (can be overridden)
        this.defaultWeights = {
            weather: 0.30,
            time: 0.20,
            crowd: 0.25,
            location: 0.15,
            visibility: 0.10
        };

        // Sub-factor definitions
        this.subFactors = {
            weather: {
                intensity: 0.4,
                stability: 0.3,
                forecast_trend: 0.2,
                seasonal_appropriateness: 0.1
            },
            time: {
                hour_of_day: 0.5,
                day_of_week: 0.2,
                seasonal_factor: 0.2,
                duration_factor: 0.1
            },
            crowd: {
                density: 0.4,
                behavior: 0.3,
                flow_pattern: 0.2,
                demographics: 0.1
            },
            location: {
                inherent_risk: 0.4,
                accessibility: 0.2,
                infrastructure: 0.2,
                historical_incidents: 0.2
            },
            visibility: {
                current_conditions: 0.5,
                lighting: 0.3,
                obstacles: 0.2
            }
        };
    }

    /**
     * Main function to analyze risk breakdown
     * @param {Object} conditions - Environmental conditions
     * @param {Object} weights - Custom weights (optional)
     * @param {Object} riskAssessment - Existing risk assessment result
     * @returns {Object} Detailed risk breakdown analysis
     */
    analyzeRiskBreakdown(conditions, weights = null, riskAssessment = null) {
        try {
            // Use provided weights or defaults
            const activeWeights = weights || this.defaultWeights;

            // Calculate base scores for each factor
            const factorScores = this.calculateFactorScores(conditions);

            // Calculate sub-factor contributions
            const subFactorAnalysis = this.analyzeSubFactors(conditions, factorScores);

            // Calculate weighted contributions
            const weightedContributions = this.calculateWeightedContributions(
                factorScores, 
                activeWeights
            );

            // Calculate percentage contributions
            const percentageBreakdown = this.calculatePercentageBreakdown(
                weightedContributions,
                activeWeights
            );

            // Analyze factor interactions
            const interactions = this.analyzeFactorInteractions(factorScores, conditions);

            // Generate decision tree
            const decisionTree = this.generateDecisionTree(
                factorScores, 
                weightedContributions, 
                riskAssessment
            );

            // Calculate confidence metrics
            const confidenceAnalysis = this.calculateConfidenceMetrics(
                factorScores, 
                conditions
            );

            // Generate explanations
            const explanations = this.generateDetailedExplanations(
                percentageBreakdown,
                factorScores,
                interactions,
                riskAssessment
            );

            // Create visualization data
            const visualizationData = this.generateVisualizationData(
                percentageBreakdown,
                subFactorAnalysis,
                interactions
            );

            return {
                success: true,
                timestamp: new Date().toISOString(),
                overall_risk: riskAssessment || this.calculateOverallRisk(weightedContributions),
                
                // Main breakdown results
                factor_scores: factorScores,
                weighted_contributions: weightedContributions,
                percentage_breakdown: percentageBreakdown,
                
                // Detailed analysis
                sub_factor_analysis: subFactorAnalysis,
                factor_interactions: interactions,
                decision_tree: decisionTree,
                confidence_analysis: confidenceAnalysis,
                
                // Explanations and insights
                explanations: explanations,
                key_insights: this.generateKeyInsights(percentageBreakdown, interactions),
                
                // Visualization support
                visualization_data: this.config.visualizationData ? visualizationData : null,
                
                // Metadata
                weights_used: activeWeights,
                analysis_config: this.config
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
     * Calculate base scores for each main factor
     */
    calculateFactorScores(conditions) {
        return {
            weather: this.calculateWeatherScore(conditions),
            time: this.calculateTimeScore(conditions),
            crowd: this.calculateCrowdScore(conditions),
            location: this.calculateLocationScore(conditions),
            visibility: this.calculateVisibilityScore(conditions)
        };
    }

    /**
     * Calculate weather factor score with sub-components
     */
    calculateWeatherScore(conditions) {
        const weatherIntensity = this.getWeatherIntensity(conditions.weather);
        const weatherStability = this.getWeatherStability(conditions);
        const forecastTrend = this.getForecastTrend(conditions);
        const seasonalAppropriate = this.getSeasonalAppropriateness(conditions);

        return {
            total_score: weatherIntensity * 0.4 + weatherStability * 0.3 + 
                        forecastTrend * 0.2 + seasonalAppropriate * 0.1,
            sub_scores: {
                intensity: weatherIntensity,
                stability: weatherStability,
                forecast_trend: forecastTrend,
                seasonal_appropriateness: seasonalAppropriate
            },
            confidence: this.calculateWeatherConfidence(conditions)
        };
    }

    /**
     * Calculate time factor score with sub-components
     */
    calculateTimeScore(conditions) {
        const hourRisk = this.getHourOfDayRisk(conditions.time);
        const dayRisk = this.getDayOfWeekRisk(conditions.time);
        const seasonalRisk = this.getSeasonalRisk(conditions.time);
        const durationRisk = this.getDurationRisk(conditions);

        return {
            total_score: hourRisk * 0.5 + dayRisk * 0.2 + seasonalRisk * 0.2 + durationRisk * 0.1,
            sub_scores: {
                hour_of_day: hourRisk,
                day_of_week: dayRisk,
                seasonal_factor: seasonalRisk,
                duration_factor: durationRisk
            },
            confidence: this.calculateTimeConfidence(conditions)
        };
    }

    /**
     * Calculate crowd factor score with sub-components
     */
    calculateCrowdScore(conditions) {
        const density = this.getCrowdDensity(conditions.crowd_density);
        const behavior = this.getCrowdBehavior(conditions);
        const flowPattern = this.getCrowdFlowPattern(conditions);
        const demographics = this.getCrowdDemographics(conditions);

        return {
            total_score: density * 0.4 + behavior * 0.3 + flowPattern * 0.2 + demographics * 0.1,
            sub_scores: {
                density: density,
                behavior: behavior,
                flow_pattern: flowPattern,
                demographics: demographics
            },
            confidence: this.calculateCrowdConfidence(conditions)
        };
    }

    /**
     * Calculate location factor score with sub-components
     */
    calculateLocationScore(conditions) {
        const inherentRisk = this.getLocationInherentRisk(conditions.location);
        const accessibility = this.getLocationAccessibility(conditions.location);
        const infrastructure = this.getInfrastructureQuality(conditions.location);
        const historicalRisk = this.getHistoricalIncidentRisk(conditions.location);

        return {
            total_score: inherentRisk * 0.4 + accessibility * 0.2 + 
                        infrastructure * 0.2 + historicalRisk * 0.2,
            sub_scores: {
                inherent_risk: inherentRisk,
                accessibility: accessibility,
                infrastructure: infrastructure,
                historical_incidents: historicalRisk
            },
            confidence: this.calculateLocationConfidence(conditions)
        };
    }

    /**
     * Calculate visibility factor score with sub-components
     */
    calculateVisibilityScore(conditions) {
        const currentConditions = this.getCurrentVisibilityConditions(conditions.visibility);
        const lighting = this.getLightingConditions(conditions);
        const obstacles = this.getVisibilityObstacles(conditions);

        return {
            total_score: currentConditions * 0.5 + lighting * 0.3 + obstacles * 0.2,
            sub_scores: {
                current_conditions: currentConditions,
                lighting: lighting,
                obstacles: obstacles
            },
            confidence: this.calculateVisibilityConfidence(conditions)
        };
    }

    /**
     * Calculate weighted contributions of each factor
     */
    calculateWeightedContributions(factorScores, weights) {
        const contributions = {};
        
        for (const [factor, weight] of Object.entries(weights)) {
            const score = factorScores[factor]?.total_score || 0;
            contributions[factor] = {
                raw_score: score,
                weight: weight,
                weighted_score: score * weight,
                normalized_contribution: 0 // Will be calculated in percentage breakdown
            };
        }

        return contributions;
    }

    /**
     * Calculate percentage breakdown of contributions
     */
    calculatePercentageBreakdown(weightedContributions, weights) {
        // Calculate total weighted score
        const totalWeightedScore = Object.values(weightedContributions)
            .reduce((sum, contrib) => sum + contrib.weighted_score, 0);

        // Calculate percentage contributions
        const percentageBreakdown = {};
        
        for (const [factor, contribution] of Object.entries(weightedContributions)) {
            const percentage = totalWeightedScore > 0 ? 
                (contribution.weighted_score / totalWeightedScore) * 100 : 0;
            
            percentageBreakdown[factor] = {
                percentage: Math.round(percentage * 10) / 10,
                raw_score: contribution.raw_score,
                weighted_score: contribution.weighted_score,
                weight: contribution.weight,
                impact_level: this.classifyImpactLevel(percentage),
                rank: 0 // Will be set after sorting
            };
        }

        // Rank factors by contribution
        const sortedFactors = Object.entries(percentageBreakdown)
            .sort(([,a], [,b]) => b.percentage - a.percentage);
        
        sortedFactors.forEach(([factor, data], index) => {
            percentageBreakdown[factor].rank = index + 1;
        });

        return percentageBreakdown;
    }

    /**
     * Analyze sub-factors in detail
     */
    analyzeSubFactors(conditions, factorScores) {
        const analysis = {};

        for (const [factor, scoreData] of Object.entries(factorScores)) {
            if (scoreData.sub_scores) {
                const subAnalysis = {};
                const totalSubScore = Object.values(scoreData.sub_scores)
                    .reduce((sum, score) => sum + score, 0);

                for (const [subFactor, score] of Object.entries(scoreData.sub_scores)) {
                    const weight = this.subFactors[factor]?.[subFactor] || 0;
                    const contribution = totalSubScore > 0 ? (score / totalSubScore) * 100 : 0;
                    
                    subAnalysis[subFactor] = {
                        score: score,
                        weight: weight,
                        contribution_percentage: Math.round(contribution * 10) / 10,
                        impact_description: this.getSubFactorImpactDescription(factor, subFactor, score)
                    };
                }

                analysis[factor] = {
                    sub_factors: subAnalysis,
                    total_score: scoreData.total_score,
                    confidence: scoreData.confidence,
                    dominant_sub_factor: this.findDominantSubFactor(subAnalysis)
                };
            }
        }

        return analysis;
    }

    /**
     * Analyze interactions between factors
     */
    analyzeFactorInteractions(factorScores, conditions) {
        const interactions = [];

        // Weather-Visibility interaction
        const weatherScore = factorScores.weather?.total_score || 0;
        const visibilityScore = factorScores.visibility?.total_score || 0;
        
        if (weatherScore > 3 && visibilityScore > 2) {
            interactions.push({
                factors: ['weather', 'visibility'],
                type: 'amplifying',
                strength: 'high',
                description: 'Poor weather conditions are significantly reducing visibility',
                impact_multiplier: 1.3
            });
        }

        // Time-Crowd interaction
        const timeScore = factorScores.time?.total_score || 0;
        const crowdScore = factorScores.crowd?.total_score || 0;
        
        if (timeScore > 2 && crowdScore > 3) {
            interactions.push({
                factors: ['time', 'crowd'],
                type: 'amplifying',
                strength: 'medium',
                description: 'High crowd density during risky time periods',
                impact_multiplier: 1.2
            });
        }

        // Location-Weather interaction
        const locationScore = factorScores.location?.total_score || 0;
        
        if (locationScore > 2 && weatherScore > 3) {
            interactions.push({
                factors: ['location', 'weather'],
                type: 'amplifying',
                strength: 'high',
                description: 'Hazardous location combined with severe weather',
                impact_multiplier: 1.4
            });
        }

        // Crowd-Visibility interaction
        if (crowdScore > 3 && visibilityScore > 2) {
            interactions.push({
                factors: ['crowd', 'visibility'],
                type: 'amplifying',
                strength: 'medium',
                description: 'Poor visibility in crowded conditions increases collision risk',
                impact_multiplier: 1.25
            });
        }

        return interactions;
    }

    /**
     * Generate decision tree showing risk escalation path
     */
    generateDecisionTree(factorScores, weightedContributions, riskAssessment) {
        const tree = {
            root: {
                condition: 'Initial Assessment',
                risk_level: 'EVALUATING',
                children: []
            }
        };

        // Sort factors by contribution
        const sortedFactors = Object.entries(weightedContributions)
            .sort(([,a], [,b]) => b.weighted_score - a.weighted_score);

        let currentNode = tree.root;
        let cumulativeRisk = 0;

        for (const [factor, contribution] of sortedFactors) {
            cumulativeRisk += contribution.weighted_score;
            const riskLevel = this.determineRiskLevel(cumulativeRisk);
            
            const childNode = {
                factor: factor,
                condition: `${factor} contributes ${contribution.weighted_score.toFixed(2)}`,
                cumulative_risk: cumulativeRisk,
                risk_level: riskLevel,
                contribution_percentage: (contribution.weighted_score / 
                    Object.values(weightedContributions).reduce((sum, c) => sum + c.weighted_score, 0)) * 100,
                children: []
            };

            currentNode.children.push(childNode);
            currentNode = childNode;
        }

        return tree;
    }

    /**
     * Calculate confidence metrics for the analysis
     */
    calculateConfidenceMetrics(factorScores, conditions) {
        const confidenceScores = {};
        let totalConfidence = 0;
        let factorCount = 0;

        for (const [factor, scoreData] of Object.entries(factorScores)) {
            if (scoreData.confidence !== undefined) {
                confidenceScores[factor] = scoreData.confidence;
                totalConfidence += scoreData.confidence;
                factorCount++;
            }
        }

        const overallConfidence = factorCount > 0 ? totalConfidence / factorCount : 0.5;

        return {
            overall_confidence: overallConfidence,
            factor_confidences: confidenceScores,
            data_quality: this.assessDataQuality(conditions),
            reliability_score: this.calculateReliabilityScore(confidenceScores, conditions)
        };
    }

    /**
     * Generate detailed explanations for each contribution
     */
    generateDetailedExplanations(percentageBreakdown, factorScores, interactions, riskAssessment) {
        const explanations = {
            summary: this.generateSummaryExplanation(percentageBreakdown, riskAssessment),
            factor_explanations: {},
            interaction_explanations: [],
            decision_rationale: this.generateDecisionRationale(percentageBreakdown, factorScores)
        };

        // Generate factor-specific explanations
        for (const [factor, breakdown] of Object.entries(percentageBreakdown)) {
            explanations.factor_explanations[factor] = {
                contribution_explanation: this.getFactorContributionExplanation(factor, breakdown),
                score_justification: this.getScoreJustification(factor, factorScores[factor]),
                impact_assessment: this.getImpactAssessment(factor, breakdown.percentage)
            };
        }

        // Generate interaction explanations
        for (const interaction of interactions) {
            explanations.interaction_explanations.push({
                factors: interaction.factors,
                explanation: interaction.description,
                impact: `Increases overall risk by ${((interaction.impact_multiplier - 1) * 100).toFixed(1)}%`
            });
        }

        return explanations;
    }

    /**
     * Generate key insights from the analysis
     */
    generateKeyInsights(percentageBreakdown, interactions) {
        const insights = [];

        // Find dominant factor
        const dominantFactor = Object.entries(percentageBreakdown)
            .reduce(([maxFactor, maxData], [factor, data]) => 
                data.percentage > maxData.percentage ? [factor, data] : [maxFactor, maxData]);

        insights.push({
            type: 'dominant_factor',
            message: `${dominantFactor[0]} is the primary risk driver, contributing ${dominantFactor[1].percentage}% to the overall risk`,
            importance: 'high'
        });

        // Check for balanced risk
        const topTwoFactors = Object.entries(percentageBreakdown)
            .sort(([,a], [,b]) => b.percentage - a.percentage)
            .slice(0, 2);

        if (Math.abs(topTwoFactors[0][1].percentage - topTwoFactors[1][1].percentage) < 10) {
            insights.push({
                type: 'balanced_risk',
                message: `Risk is balanced between ${topTwoFactors[0][0]} (${topTwoFactors[0][1].percentage}%) and ${topTwoFactors[1][0]} (${topTwoFactors[1][1].percentage}%)`,
                importance: 'medium'
            });
        }

        // Check for amplifying interactions
        const amplifyingInteractions = interactions.filter(i => i.type === 'amplifying');
        if (amplifyingInteractions.length > 0) {
            insights.push({
                type: 'amplifying_interactions',
                message: `${amplifyingInteractions.length} factor interactions are amplifying the overall risk`,
                importance: 'high'
            });
        }

        // Check for low-impact factors
        const lowImpactFactors = Object.entries(percentageBreakdown)
            .filter(([, data]) => data.percentage < 5)
            .map(([factor]) => factor);

        if (lowImpactFactors.length > 0) {
            insights.push({
                type: 'minimal_factors',
                message: `${lowImpactFactors.join(', ')} have minimal impact on current risk assessment`,
                importance: 'low'
            });
        }

        return insights;
    }

    /**
     * Generate visualization data for charts and graphs
     */
    generateVisualizationData(percentageBreakdown, subFactorAnalysis, interactions) {
        return {
            pie_chart: {
                labels: Object.keys(percentageBreakdown),
                data: Object.values(percentageBreakdown).map(d => d.percentage),
                colors: this.getFactorColors()
            },
            bar_chart: {
                factors: Object.keys(percentageBreakdown),
                percentages: Object.values(percentageBreakdown).map(d => d.percentage),
                raw_scores: Object.values(percentageBreakdown).map(d => d.raw_score)
            },
            sub_factor_breakdown: this.formatSubFactorVisualization(subFactorAnalysis),
            interaction_network: this.formatInteractionVisualization(interactions),
            risk_progression: this.generateRiskProgressionData(percentageBreakdown)
        };
    }

    /**
     * Helper methods for score calculations
     */
    getWeatherIntensity(weather) {
        const intensityMap = {
            'clear': 0, 'sunny': 0, 'cloudy': 1, 'overcast': 1.5,
            'light_rain': 2, 'rainy': 3, 'heavy_rain': 4,
            'thunderstorm': 5, 'stormy': 5, 'foggy': 3,
            'snow': 3, 'blizzard': 5, 'tornado': 10, 'hurricane': 10
        };
        return intensityMap[weather?.toLowerCase()] || 1;
    }

    getWeatherStability(conditions) {
        // Placeholder - would analyze weather trend data
        return Math.random() * 2 + 1; // 1-3 scale
    }

    getForecastTrend(conditions) {
        // Placeholder - would analyze forecast data
        return Math.random() * 2 + 1; // 1-3 scale
    }

    getSeasonalAppropriateness(conditions) {
        // Placeholder - would check if weather is appropriate for season
        return Math.random() * 2 + 1; // 1-3 scale
    }

    getHourOfDayRisk(time) {
        const hour = new Date().getHours();
        if (hour >= 22 || hour <= 5) return 3; // Night
        if (hour >= 18 || hour <= 7) return 2; // Evening/Early morning
        return 1; // Day
    }

    getDayOfWeekRisk(time) {
        const day = new Date().getDay();
        return (day === 0 || day === 6) ? 1.5 : 1; // Weekend slightly higher
    }

    getSeasonalRisk(time) {
        const month = new Date().getMonth();
        // Winter months have higher risk
        return (month >= 11 || month <= 2) ? 2 : 1;
    }

    getDurationRisk(conditions) {
        // Placeholder - would analyze planned duration
        return 1;
    }

    getCrowdDensity(crowdDensity) {
        const densityMap = {
            'isolated': 0, 'light': 1, 'moderate': 2,
            'heavy': 3, 'overcrowded': 4, 'dangerous': 5
        };
        return densityMap[crowdDensity?.toLowerCase()] || 2;
    }

    getCrowdBehavior(conditions) {
        // Placeholder - would analyze crowd behavior indicators
        return Math.random() * 3 + 1; // 1-4 scale
    }

    getCrowdFlowPattern(conditions) {
        // Placeholder - would analyze crowd movement patterns
        return Math.random() * 2 + 1; // 1-3 scale
    }

    getCrowdDemographics(conditions) {
        // Placeholder - would analyze crowd composition
        return Math.random() * 2 + 1; // 1-3 scale
    }

    getLocationInherentRisk(location) {
        if (!location) return 1;
        const locationStr = location.toString().toLowerCase();
        
        let risk = 1;
        if (locationStr.includes('construction')) risk += 2;
        if (locationStr.includes('water')) risk += 1;
        if (locationStr.includes('mountain')) risk += 1.5;
        if (locationStr.includes('industrial')) risk += 2;
        
        return Math.min(risk, 5);
    }

    getLocationAccessibility(location) {
        // Placeholder - would analyze accessibility factors
        return Math.random() * 2 + 1; // 1-3 scale
    }

    getInfrastructureQuality(location) {
        // Placeholder - would analyze infrastructure quality
        return Math.random() * 2 + 1; // 1-3 scale
    }

    getHistoricalIncidentRisk(location) {
        // Placeholder - would check historical incident data
        return Math.random() * 2 + 1; // 1-3 scale
    }

    getCurrentVisibilityConditions(visibility) {
        if (typeof visibility === 'number') {
            return (1 - visibility) * 4; // Invert: low visibility = high risk
        }
        
        const visibilityMap = {
            'excellent': 0, 'good': 1, 'fair': 2,
            'poor': 3, 'very_poor': 4, 'zero': 5
        };
        
        return visibilityMap[visibility?.toLowerCase()] || 2;
    }

    getLightingConditions(conditions) {
        const hour = new Date().getHours();
        if (hour >= 20 || hour <= 6) return 3; // Dark
        if (hour >= 18 || hour <= 8) return 2; // Dim
        return 1; // Bright
    }

    getVisibilityObstacles(conditions) {
        // Placeholder - would analyze physical obstacles
        return Math.random() * 2 + 1; // 1-3 scale
    }

    /**
     * Confidence calculation methods
     */
    calculateWeatherConfidence(conditions) {
        return conditions.weather ? 0.9 : 0.5;
    }

    calculateTimeConfidence(conditions) {
        return 0.95; // Time is usually very reliable
    }

    calculateCrowdConfidence(conditions) {
        return conditions.crowd_density ? 0.8 : 0.4;
    }

    calculateLocationConfidence(conditions) {
        return conditions.location ? 0.85 : 0.3;
    }

    calculateVisibilityConfidence(conditions) {
        return conditions.visibility !== undefined ? 0.8 : 0.5;
    }

    /**
     * Utility methods
     */
    classifyImpactLevel(percentage) {
        if (percentage >= 40) return 'CRITICAL';
        if (percentage >= 25) return 'HIGH';
        if (percentage >= 15) return 'MEDIUM';
        if (percentage >= 5) return 'LOW';
        return 'MINIMAL';
    }

    determineRiskLevel(score) {
        if (score >= 4) return 'HIGH';
        if (score >= 2.5) return 'MEDIUM';
        return 'LOW';
    }

    calculateOverallRisk(weightedContributions) {
        const totalScore = Object.values(weightedContributions)
            .reduce((sum, contrib) => sum + contrib.weighted_score, 0);
        
        return {
            risk_level: this.determineRiskLevel(totalScore),
            risk_score: totalScore
        };
    }

    findDominantSubFactor(subAnalysis) {
        return Object.entries(subAnalysis)
            .reduce(([maxFactor, maxData], [factor, data]) => 
                data.contribution_percentage > maxData.contribution_percentage ? 
                [factor, data] : [maxFactor, maxData])[0];
    }

    getFactorColors() {
        return {
            weather: '#3B82F6',
            time: '#8B5CF6', 
            crowd: '#EF4444',
            location: '#F59E0B',
            visibility: '#10B981'
        };
    }

    getSubFactorImpactDescription(factor, subFactor, score) {
        // Generate contextual descriptions based on factor, sub-factor, and score
        const descriptions = {
            weather: {
                intensity: score > 3 ? 'Severe weather conditions' : 'Moderate weather impact',
                stability: score > 2 ? 'Rapidly changing conditions' : 'Stable weather pattern'
            },
            crowd: {
                density: score > 3 ? 'Overcrowded conditions' : 'Manageable crowd levels',
                behavior: score > 2 ? 'Concerning crowd behavior' : 'Normal crowd behavior'
            }
            // Add more as needed
        };

        return descriptions[factor]?.[subFactor] || `${subFactor} contributing ${score.toFixed(1)} points`;
    }

    generateSummaryExplanation(percentageBreakdown, riskAssessment) {
        const topFactor = Object.entries(percentageBreakdown)
            .reduce(([maxFactor, maxData], [factor, data]) => 
                data.percentage > maxData.percentage ? [factor, data] : [maxFactor, maxData]);

        return `The primary risk driver is ${topFactor[0]}, contributing ${topFactor[1].percentage}% to the overall ${riskAssessment?.risk_level || 'UNKNOWN'} risk assessment.`;
    }

    getFactorContributionExplanation(factor, breakdown) {
        return `${factor} contributes ${breakdown.percentage}% to the total risk (rank #${breakdown.rank}), with a raw score of ${breakdown.raw_score.toFixed(2)} and impact level classified as ${breakdown.impact_level}.`;
    }

    getScoreJustification(factor, scoreData) {
        if (!scoreData || !scoreData.sub_scores) {
            return `${factor} score based on standard risk assessment criteria.`;
        }

        const topSubFactor = Object.entries(scoreData.sub_scores)
            .reduce(([maxSub, maxScore], [sub, score]) => 
                score > maxScore ? [sub, score] : [maxSub, maxScore]);

        return `${factor} score of ${scoreData.total_score.toFixed(2)} primarily driven by ${topSubFactor[0]} (${topSubFactor[1].toFixed(2)}).`;
    }

    getImpactAssessment(factor, percentage) {
        const impact = this.classifyImpactLevel(percentage);
        return `${factor} has ${impact.toLowerCase()} impact on the overall risk decision.`;
    }

    generateDecisionRationale(percentageBreakdown, factorScores) {
        const sortedFactors = Object.entries(percentageBreakdown)
            .sort(([,a], [,b]) => b.percentage - a.percentage);

        let rationale = "Risk decision based on: ";
        rationale += sortedFactors.slice(0, 3)
            .map(([factor, data]) => `${factor} (${data.percentage}%)`)
            .join(", ");

        return rationale;
    }

    assessDataQuality(conditions) {
        const requiredFields = ['weather', 'location', 'time'];
        const providedFields = requiredFields.filter(field => conditions[field] !== undefined);
        
        return {
            completeness: (providedFields.length / requiredFields.length) * 100,
            missing_fields: requiredFields.filter(field => conditions[field] === undefined)
        };
    }

    calculateReliabilityScore(confidenceScores, conditions) {
        const avgConfidence = Object.values(confidenceScores).reduce((sum, conf) => sum + conf, 0) / Object.values(confidenceScores).length;
        const dataQuality = this.assessDataQuality(conditions);
        
        return (avgConfidence * 0.7 + (dataQuality.completeness / 100) * 0.3);
    }

    formatSubFactorVisualization(subFactorAnalysis) {
        const formatted = {};
        
        for (const [factor, analysis] of Object.entries(subFactorAnalysis)) {
            formatted[factor] = {
                labels: Object.keys(analysis.sub_factors),
                data: Object.values(analysis.sub_factors).map(sf => sf.contribution_percentage)
            };
        }
        
        return formatted;
    }

    formatInteractionVisualization(interactions) {
        return interactions.map(interaction => ({
            source: interaction.factors[0],
            target: interaction.factors[1],
            strength: interaction.strength,
            type: interaction.type,
            multiplier: interaction.impact_multiplier
        }));
    }

    generateRiskProgressionData(percentageBreakdown) {
        const sortedFactors = Object.entries(percentageBreakdown)
            .sort(([,a], [,b]) => b.percentage - a.percentage);

        let cumulative = 0;
        return sortedFactors.map(([factor, data]) => {
            cumulative += data.percentage;
            return {
                factor: factor,
                individual_contribution: data.percentage,
                cumulative_contribution: cumulative
            };
        });
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RiskBreakdownAnalyzer;
}

// Make available globally for browser use
if (typeof window !== 'undefined') {
    window.RiskBreakdownAnalyzer = RiskBreakdownAnalyzer;
}