/**
 * What-If Simulation Tool
 * Recalculates risk when environmental parameters are modified
 */

class WhatIfSimulator {
    constructor(options = {}) {
        this.config = {
            enableRealTimeUpdates: options.enableRealTimeUpdates !== false,
            maxSimulations: options.maxSimulations || 100,
            cacheResults: options.cacheResults !== false,
            enableLogging: options.enableLogging || true
        };

        // Risk assessment engines
        this.riskEngine = null;
        this.breakdownAnalyzer = null;

        // Simulation state
        this.baselineScenario = null;
        this.currentScenario = null;
        this.simulationHistory = [];
        this.scenarioCache = new Map();

        // Parameter definitions
        this.parameterDefinitions = {
            weather: {
                type: 'categorical',
                values: ['clear', 'cloudy', 'rainy', 'stormy', 'foggy', 'snow', 'thunderstorm'],
                default: 'clear'
            },
            visibility: {
                type: 'continuous',
                min: 0.0,
                max: 1.0,
                default: 0.8,
                step: 0.1
            },
            crowd_density: {
                type: 'categorical',
                values: ['isolated', 'light', 'moderate', 'heavy', 'overcrowded'],
                default: 'moderate'
            },
            time_of_day: {
                type: 'categorical',
                values: ['dawn', 'morning', 'afternoon', 'evening', 'night', 'late_night'],
                default: 'afternoon'
            },
            location_type: {
                type: 'categorical',
                values: ['urban', 'suburban', 'rural', 'wilderness', 'industrial'],
                default: 'urban'
            },
            temperature: {
                type: 'continuous',
                min: -20,
                max: 50,
                default: 20,
                step: 1
            }
        };

        // Scenario templates
        this.scenarioTemplates = {
            'severe_weather': {
                name: 'Severe Weather Event',
                parameters: {
                    weather: 'thunderstorm',
                    visibility: 0.3,
                    crowd_density: 'light'
                }
            },
            'crowded_event': {
                name: 'Crowded Event',
                parameters: {
                    crowd_density: 'overcrowded',
                    time_of_day: 'evening',
                    location_type: 'urban'
                }
            },
            'night_emergency': {
                name: 'Night Emergency',
                parameters: {
                    time_of_day: 'late_night',
                    visibility: 0.2,
                    crowd_density: 'isolated'
                }
            }
        };

        this.initialize();
    }

    initialize() {
        this.log('What-If Simulator initializing...');
    }

    setEngines(engines) {
        this.riskEngine = engines.riskEngine;
        this.breakdownAnalyzer = engines.breakdownAnalyzer;
        this.log('Risk assessment engines configured');
    }

    setBaseline(scenario) {
        try {
            this.validateScenario(scenario);
            this.baselineScenario = { ...scenario };
            this.currentScenario = { ...scenario };

            const baselineAssessment = this.calculateRiskAssessment(scenario);

            return {
                success: true,
                baseline: this.baselineScenario,
                assessment: baselineAssessment,
                timestamp: new Date().toISOString()
            };
        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    runSimulation(modifications, options = {}) {
        try {
            const simulationId = this.generateSimulationId();
            
            // Create modified scenario
            const modifiedScenario = this.applyModifications(this.currentScenario, modifications);
            this.validateScenario(modifiedScenario);

            // Calculate risk assessment
            const assessment = this.calculateRiskAssessment(modifiedScenario);

            // Compare with baseline
            const comparison = this.compareWithBaseline(assessment, modifiedScenario);

            // Generate insights
            const insights = this.generateSimulationInsights(assessment, comparison, modifications);

            const result = {
                success: true,
                simulation_id: simulationId,
                timestamp: new Date().toISOString(),
                original_scenario: this.currentScenario,
                modified_scenario: modifiedScenario,
                modifications_applied: modifications,
                risk_assessment: assessment,
                baseline_comparison: comparison,
                insights: insights
            };

            this.storeSimulation(result);

            if (options.updateCurrent) {
                this.currentScenario = modifiedScenario;
            }

            return result;

        } catch (error) {
            return {
                success: false,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    runScenarioComparison(scenarioList, options = {}) {
        try {
            const comparisonId = this.generateComparisonId();
            const results = [];

            for (let i = 0; i < scenarioList.length; i++) {
                const scenario = scenarioList[i];
                const result = this.runSimulation(scenario.modifications, {
                    ...options,
                    updateCurrent: false
                });

                if (result.success) {
                    results.push({
                        name: scenario.name || `Scenario ${i + 1}`,
                        description: scenario.description || '',
                        ...result
                    });
                }
            }

            const rankedScenarios = this.rankScenariosByRisk(results);

            return {
                success: true,
                comparison_id: comparisonId,
                timestamp: new Date().toISOString(),
                scenarios: results,
                ranked_scenarios: rankedScenarios,
                summary: this.generateComparisonSummary(results)
            };

        } catch (error) {
            return {
                success: false,
                error: error.message
            };
        }
    }

    runScenarioTemplate(templateName, customizations = {}) {
        const template = this.scenarioTemplates[templateName];
        
        if (!template) {
            return {
                success: false,
                error: `Unknown scenario template: ${templateName}`
            };
        }

        const modifications = { ...template.parameters, ...customizations };
        return this.runSimulation(modifications, {
            scenarioName: template.name
        });
    }

    applyModifications(baseScenario, modifications) {
        const modifiedScenario = { ...baseScenario };

        for (const [paramName, newValue] of Object.entries(modifications)) {
            const paramDef = this.parameterDefinitions[paramName];
            
            if (paramDef && this.validateParameterValue(paramName, newValue, paramDef)) {
                modifiedScenario[paramName] = newValue;
            }
        }

        return modifiedScenario;
    }

    calculateRiskAssessment(scenario) {
        const cacheKey = this.generateScenarioHash(scenario);
        if (this.config.cacheResults && this.scenarioCache.has(cacheKey)) {
            return this.scenarioCache.get(cacheKey);
        }

        const conditions = this.convertScenarioToConditions(scenario);
        let assessment = {};

        if (this.riskEngine) {
            const riskResult = this.riskEngine.assessRiskAdaptive ? 
                this.riskEngine.assessRiskAdaptive(conditions) :
                this.riskEngine.assessRisk(conditions.location, conditions.time, conditions.weather, conditions.crowd_density);
            
            assessment = riskResult.risk_assessment || riskResult;
        } else {
            assessment = this.calculateFallbackRisk(scenario);
        }

        if (this.breakdownAnalyzer) {
            const breakdown = this.breakdownAnalyzer.analyzeRiskBreakdown(conditions);
            assessment.breakdown = breakdown.percentage_breakdown;
        }

        if (this.config.cacheResults) {
            this.scenarioCache.set(cacheKey, assessment);
        }

        return assessment;
    }

    compareWithBaseline(assessment, scenario) {
        if (!this.baselineScenario) {
            return { no_baseline: true };
        }

        const baselineAssessment = this.calculateRiskAssessment(this.baselineScenario);

        return {
            risk_score_change: assessment.risk_score - baselineAssessment.risk_score,
            risk_level_change: {
                from: baselineAssessment.risk_level,
                to: assessment.risk_level,
                escalated: this.isRiskEscalated(baselineAssessment.risk_level, assessment.risk_level)
            },
            confidence_change: (assessment.confidence || 0) - (baselineAssessment.confidence || 0),
            parameter_changes: this.calculateParameterChanges(this.baselineScenario, scenario)
        };
    }

    generateSimulationInsights(assessment, comparison, modifications) {
        const insights = {
            key_findings: [],
            risk_drivers: [],
            recommendations: []
        };

        if (comparison.risk_score_change > 1) {
            insights.key_findings.push({
                type: 'risk_increase',
                message: `Risk increased by ${comparison.risk_score_change.toFixed(1)} points`,
                impact: 'high'
            });
        } else if (comparison.risk_score_change < -1) {
            insights.key_findings.push({
                type: 'risk_decrease',
                message: `Risk decreased by ${Math.abs(comparison.risk_score_change).toFixed(1)} points`,
                impact: 'positive'
            });
        }

        if (assessment.breakdown) {
            const topFactors = Object.entries(assessment.breakdown)
                .sort(([,a], [,b]) => b.percentage - a.percentage)
                .slice(0, 3);

            for (const [factor, data] of topFactors) {
                insights.risk_drivers.push({
                    factor: factor,
                    contribution: data.percentage,
                    impact_level: data.impact_level
                });
            }
        }

        return insights;
    }

    validateScenario(scenario) {
        for (const [paramName, paramValue] of Object.entries(scenario)) {
            const paramDef = this.parameterDefinitions[paramName];
            if (paramDef && !this.validateParameterValue(paramName, paramValue, paramDef)) {
                throw new Error(`Invalid value for parameter ${paramName}: ${paramValue}`);
            }
        }
        return true;
    }

    validateParameterValue(paramName, value, paramDef) {
        if (paramDef.type === 'categorical') {
            return paramDef.values.includes(value);
        } else if (paramDef.type === 'continuous') {
            return typeof value === 'number' && value >= paramDef.min && value <= paramDef.max;
        }
        return false;
    }

    convertScenarioToConditions(scenario) {
        return {
            location: scenario.location_type || 'urban',
            time: scenario.time_of_day || 'afternoon',
            weather: scenario.weather || 'clear',
            crowd_density: scenario.crowd_density || 'moderate',
            visibility: scenario.visibility || 0.8,
            temperature: scenario.temperature || 20
        };
    }

    calculateFallbackRisk(scenario) {
        let riskScore = 0;
        
        const weatherRisk = {
            'clear': 0, 'cloudy': 1, 'rainy': 2, 'stormy': 4, 
            'foggy': 3, 'snow': 3, 'thunderstorm': 5
        };
        riskScore += weatherRisk[scenario.weather] || 0;
        
        riskScore += (1 - (scenario.visibility || 0.8)) * 3;
        
        const crowdRisk = {
            'isolated': 1, 'light': 0, 'moderate': 1, 'heavy': 2, 'overcrowded': 4
        };
        riskScore += crowdRisk[scenario.crowd_density] || 0;
        
        const timeRisk = {
            'dawn': 1, 'morning': 0, 'afternoon': 0, 'evening': 1, 'night': 2, 'late_night': 3
        };
        riskScore += timeRisk[scenario.time_of_day] || 0;
        
        let riskLevel = 'LOW';
        if (riskScore >= 7) riskLevel = 'CRITICAL';
        else if (riskScore >= 5) riskLevel = 'HIGH';
        else if (riskScore >= 3) riskLevel = 'MEDIUM';
        
        return {
            risk_score: riskScore,
            risk_level: riskLevel,
            confidence: 0.7,
            factors: Object.keys(scenario)
        };
    }

    generateSimulationId() {
        return 'sim_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateComparisonId() {
        return 'comp_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateScenarioHash(scenario) {
        return JSON.stringify(scenario, Object.keys(scenario).sort());
    }

    storeSimulation(result) {
        this.simulationHistory.push(result);
        
        if (this.simulationHistory.length > this.config.maxSimulations) {
            this.simulationHistory = this.simulationHistory.slice(-this.config.maxSimulations);
        }
    }

    isRiskEscalated(fromLevel, toLevel) {
        const levels = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
        return levels.indexOf(toLevel) > levels.indexOf(fromLevel);
    }

    calculateParameterChanges(baseline, current) {
        const changes = {};
        
        for (const [param, value] of Object.entries(current)) {
            if (baseline[param] !== value) {
                changes[param] = {
                    from: baseline[param],
                    to: value
                };
            }
        }
        
        return changes;
    }

    rankScenariosByRisk(results) {
        return results.sort((a, b) => b.risk_assessment.risk_score - a.risk_assessment.risk_score);
    }

    generateComparisonSummary(results) {
        const riskScores = results.map(r => r.risk_assessment.risk_score);
        const avgRisk = riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length;
        const maxRisk = Math.max(...riskScores);
        const minRisk = Math.min(...riskScores);

        return {
            total_scenarios: results.length,
            average_risk_score: avgRisk.toFixed(2),
            highest_risk_score: maxRisk,
            lowest_risk_score: minRisk,
            risk_range: maxRisk - minRisk
        };
    }

    getSimulationHistory() {
        return [...this.simulationHistory];
    }

    getSimulatorStatus() {
        return {
            baseline_set: this.baselineScenario !== null,
            simulations_run: this.simulationHistory.length,
            cache_size: this.scenarioCache.size,
            available_templates: Object.keys(this.scenarioTemplates),
            parameter_definitions: Object.keys(this.parameterDefinitions)
        };
    }

    getParameterDefinitions() {
        return JSON.parse(JSON.stringify(this.parameterDefinitions));
    }

    getScenarioTemplates() {
        return JSON.parse(JSON.stringify(this.scenarioTemplates));
    }

    clearCache() {
        this.scenarioCache.clear();
        this.log('Scenario cache cleared');
    }

    reset() {
        this.baselineScenario = null;
        this.currentScenario = null;
        this.simulationHistory = [];
        this.scenarioCache.clear();
        this.log('Simulator reset');
    }

    log(message) {
        if (this.config.enableLogging) {
            console.log(`[WhatIfSimulator] ${new Date().toISOString()}: ${message}`);
        }
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = WhatIfSimulator;
}

// Make available globally for browser use
if (typeof window !== 'undefined') {
    window.WhatIfSimulator = WhatIfSimulator;
}