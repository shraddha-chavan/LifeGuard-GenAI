/**
 * 👁️ AI Vision System - Computer Vision for Safety Analysis
 * Advanced image processing and environmental visual analysis
 */

class AIVisionSystem {
    constructor() {
        this.isInitialized = false;
        this.camera = null;
        this.canvas = null;
        this.context = null;
        this.videoStream = null;
        
        // AI Models
        this.objectDetector = new ObjectDetectionAI();
        this.hazardAnalyzer = new HazardDetectionAI();
        this.crowdAnalyzer = new CrowdAnalysisAI();
        this.weatherAnalyzer = new WeatherVisionAI();
        this.safetyAnalyzer = new SafetyEquipmentAI();
        
        // Analysis settings
        this.analysisInterval = 2000; // Analyze every 2 seconds
        this.confidenceThreshold = 0.7;
        this.analysisTimer = null;
        
        this.initialize();
    }

    async initialize() {
        try {
            console.log('👁️ Initializing AI Vision System...');
            await this.setupCamera();
            await this.initializeAIModels();
            this.isInitialized = true;
            console.log('✅ AI Vision System Ready!');
        } catch (error) {
            console.error('🚨 Vision System Error:', error);
            this.isInitialized = false;
        }
    }

    /**
     * 📷 Setup Camera Access
     */
    async setupCamera() {
        try {
            // Request camera permissions
            const constraints = {
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'environment' // Use back camera on mobile
                }
            };

            this.videoStream = await navigator.mediaDevices.getUserMedia(constraints);
            
            // Create video element
            this.camera = document.createElement('video');
            this.camera.srcObject = this.videoStream;
            this.camera.autoplay = true;
            this.camera.playsInline = true;
            
            // Create canvas for image processing
            this.canvas = document.createElement('canvas');
            this.context = this.canvas.getContext('2d');
            
            return true;
        } catch (error) {
            console.warn('📷 Camera not available:', error);
            return false;
        }
    }

    /**
     * 🧠 Initialize AI Models
     */
    async initializeAIModels() {
        await Promise.all([
            this.objectDetector.initialize(),
            this.hazardAnalyzer.initialize(),
            this.crowdAnalyzer.initialize(),
            this.weatherAnalyzer.initialize(),
            this.safetyAnalyzer.initialize()
        ]);
    }

    /**
     * 🔍 Start Continuous Analysis
     */
    startAnalysis() {
        if (!this.isInitialized) {
            console.warn('⚠️ Vision system not initialized');
            return;
        }

        this.analysisTimer = setInterval(async () => {
            await this.performAnalysis();
        }, this.analysisInterval);

        console.log('🔍 Started continuous visual analysis');
    }

    /**
     * ⏹️ Stop Analysis
     */
    stopAnalysis() {
        if (this.analysisTimer) {
            clearInterval(this.analysisTimer);
            this.analysisTimer = null;
        }
        console.log('⏹️ Stopped visual analysis');
    }

    /**
     * 📊 Perform Complete Visual Analysis
     */
    async performAnalysis() {
        try {
            // Capture current frame
            const imageData = this.captureFrame();
            if (!imageData) return null;

            // Run parallel analysis
            const [
                objects,
                hazards,
                crowdMetrics,
                weatherCues,
                safetyEquipment
            ] = await Promise.all([
                this.objectDetector.detect(imageData),
                this.hazardAnalyzer.analyze(imageData),
                this.crowdAnalyzer.analyze(imageData),
                this.weatherAnalyzer.analyze(imageData),
                this.safetyAnalyzer.detect(imageData)
            ]);

            // Combine results
            const analysis = {
                timestamp: new Date().toISOString(),
                image_quality: this.assessImageQuality(imageData),
                objects_detected: objects,
                hazards_identified: hazards,
                crowd_analysis: crowdMetrics,
                weather_visual_cues: weatherCues,
                safety_equipment: safetyEquipment,
                overall_safety_score: this.calculateOverallSafetyScore(objects, hazards, crowdMetrics),
                recommendations: this.generateVisualRecommendations(objects, hazards, crowdMetrics)
            };

            // Trigger analysis event
            this.dispatchAnalysisEvent(analysis);
            
            return analysis;

        } catch (error) {
            console.error('🚨 Analysis Error:', error);
            return null;
        }
    }

    /**
     * 📸 Capture Current Frame
     */
    captureFrame() {
        if (!this.camera || !this.canvas || !this.context) return null;

        try {
            // Set canvas size to match video
            this.canvas.width = this.camera.videoWidth;
            this.canvas.height = this.camera.videoHeight;

            // Draw current video frame to canvas
            this.context.drawImage(this.camera, 0, 0);

            // Get image data
            return this.context.getImageData(0, 0, this.canvas.width, this.canvas.height);
        } catch (error) {
            console.error('📸 Frame capture error:', error);
            return null;
        }
    }

    /**
     * 🎯 Object Detection AI
     */
    class ObjectDetectionAI {
        constructor() {
            this.modelLoaded = false;
            this.objectClasses = [
                'person', 'car', 'truck', 'bus', 'motorcycle', 'bicycle',
                'traffic_light', 'stop_sign', 'fire_hydrant', 'bench',
                'building', 'tree', 'pole', 'fence', 'barrier'
            ];
        }

        async initialize() {
            // Simulate model loading
            console.log('🎯 Loading object detection model...');
            this.modelLoaded = true;
        }

        async detect(imageData) {
            if (!this.modelLoaded) return [];

            // Simulate object detection
            const detectedObjects = [];
            const numObjects = Math.floor(Math.random() * 8) + 2; // 2-10 objects

            for (let i = 0; i < numObjects; i++) {
                const objectClass = this.objectClasses[Math.floor(Math.random() * this.objectClasses.length)];
                const confidence = 0.6 + Math.random() * 0.4; // 60-100% confidence

                if (confidence >= 0.7) { // Only include high-confidence detections
                    detectedObjects.push({
                        class: objectClass,
                        confidence: confidence,
                        bounding_box: this.generateBoundingBox(),
                        safety_relevance: this.assessSafetyRelevance(objectClass),
                        risk_level: this.assessObjectRisk(objectClass)
                    });
                }
            }

            return detectedObjects;
        }

        generateBoundingBox() {
            return {
                x: Math.floor(Math.random() * 800),
                y: Math.floor(Math.random() * 600),
                width: Math.floor(Math.random() * 200) + 50,
                height: Math.floor(Math.random() * 200) + 50
            };
        }

        assessSafetyRelevance(objectClass) {
            const relevanceMap = {
                'person': 'high',
                'car': 'high',
                'truck': 'high',
                'traffic_light': 'medium',
                'stop_sign': 'medium',
                'fire_hydrant': 'low',
                'building': 'low',
                'tree': 'low'
            };
            return relevanceMap[objectClass] || 'low';
        }

        assessObjectRisk(objectClass) {
            const riskMap = {
                'person': 'medium',
                'car': 'high',
                'truck': 'high',
                'motorcycle': 'high',
                'bicycle': 'medium',
                'traffic_light': 'low',
                'building': 'low'
            };
            return riskMap[objectClass] || 'low';
        }
    }

    /**
     * ⚠️ Hazard Detection AI
     */
    class HazardDetectionAI {
        constructor() {
            this.hazardTypes = [
                'wet_surface', 'construction_zone', 'broken_glass',
                'poor_lighting', 'obstruction', 'uneven_surface',
                'ice', 'debris', 'open_manhole', 'electrical_hazard'
            ];
        }

        async initialize() {
            console.log('⚠️ Loading hazard detection model...');
        }

        async analyze(imageData) {
            // Simulate hazard detection
            const hazards = [];
            const numHazards = Math.floor(Math.random() * 4); // 0-3 hazards

            for (let i = 0; i < numHazards; i++) {
                const hazardType = this.hazardTypes[Math.floor(Math.random() * this.hazardTypes.length)];
                const severity = this.assessHazardSeverity(hazardType);
                const confidence = 0.5 + Math.random() * 0.5;

                if (confidence >= 0.6) {
                    hazards.push({
                        type: hazardType,
                        severity: severity,
                        confidence: confidence,
                        location: this.estimateHazardLocation(),
                        description: this.generateHazardDescription(hazardType, severity),
                        recommended_action: this.getRecommendedAction(hazardType, severity)
                    });
                }
            }

            return hazards;
        }

        assessHazardSeverity(hazardType) {
            const severityMap = {
                'wet_surface': 'medium',
                'construction_zone': 'high',
                'broken_glass': 'medium',
                'poor_lighting': 'medium',
                'obstruction': 'medium',
                'uneven_surface': 'low',
                'ice': 'high',
                'debris': 'low',
                'open_manhole': 'critical',
                'electrical_hazard': 'critical'
            };
            return severityMap[hazardType] || 'low';
        }

        estimateHazardLocation() {
            const locations = ['center', 'left', 'right', 'foreground', 'background'];
            return locations[Math.floor(Math.random() * locations.length)];
        }

        generateHazardDescription(type, severity) {
            const descriptions = {
                'wet_surface': `${severity} slip hazard detected on walking surface`,
                'construction_zone': `Active construction area with ${severity} risk level`,
                'broken_glass': `Glass fragments creating ${severity} injury risk`,
                'poor_lighting': `Inadequate lighting creating ${severity} visibility issues`,
                'obstruction': `Path obstruction with ${severity} navigation difficulty`
            };
            return descriptions[type] || `${type} hazard detected with ${severity} severity`;
        }

        getRecommendedAction(type, severity) {
            if (severity === 'critical') return 'Avoid area immediately';
            if (severity === 'high') return 'Exercise extreme caution';
            if (severity === 'medium') return 'Proceed with caution';
            return 'Be aware and careful';
        }
    }

    /**
     * 👥 Crowd Analysis AI
     */
    class CrowdAnalysisAI {
        async initialize() {
            console.log('👥 Loading crowd analysis model...');
        }

        async analyze(imageData) {
            // Simulate crowd analysis
            const peopleCount = Math.floor(Math.random() * 20);
            const density = this.calculateDensity(peopleCount);
            const flowPattern = this.analyzeFlowPattern();
            const behavior = this.analyzeBehavior();

            return {
                people_count: peopleCount,
                density_level: density,
                flow_pattern: flowPattern,
                behavior_analysis: behavior,
                congestion_points: this.identifyCongestionPoints(peopleCount),
                safety_concerns: this.identifySafetyConcerns(density, behavior),
                recommended_actions: this.generateCrowdRecommendations(density, behavior)
            };
        }

        calculateDensity(count) {
            if (count === 0) return 'empty';
            if (count <= 3) return 'sparse';
            if (count <= 8) return 'moderate';
            if (count <= 15) return 'dense';
            return 'overcrowded';
        }

        analyzeFlowPattern() {
            const patterns = ['orderly', 'chaotic', 'bottleneck', 'dispersed', 'converging'];
            return patterns[Math.floor(Math.random() * patterns.length)];
        }

        analyzeBehavior() {
            const behaviors = ['calm', 'hurried', 'agitated', 'confused', 'organized'];
            return behaviors[Math.floor(Math.random() * behaviors.length)];
        }

        identifyCongestionPoints(count) {
            if (count > 10) {
                return ['entrance', 'narrow_passage'];
            }
            return [];
        }

        identifySafetyConcerns(density, behavior) {
            const concerns = [];
            
            if (density === 'overcrowded') concerns.push('overcrowding_risk');
            if (behavior === 'agitated') concerns.push('crowd_agitation');
            if (behavior === 'chaotic') concerns.push('unpredictable_movement');
            
            return concerns;
        }

        generateCrowdRecommendations(density, behavior) {
            const recommendations = [];
            
            if (density === 'overcrowded') {
                recommendations.push('Find alternative route');
                recommendations.push('Wait for crowd to disperse');
            }
            
            if (behavior === 'agitated' || behavior === 'chaotic') {
                recommendations.push('Maintain safe distance');
                recommendations.push('Stay alert for sudden movements');
            }
            
            return recommendations;
        }
    }

    /**
     * 🌤️ Weather Vision AI
     */
    class WeatherVisionAI {
        async initialize() {
            console.log('🌤️ Loading weather vision model...');
        }

        async analyze(imageData) {
            // Simulate weather condition detection from visual cues
            const conditions = this.detectWeatherConditions();
            const visibility = this.assessVisibility();
            const lighting = this.assessLighting();

            return {
                detected_conditions: conditions,
                visibility_assessment: visibility,
                lighting_conditions: lighting,
                weather_severity: this.calculateWeatherSeverity(conditions, visibility),
                impact_on_safety: this.assessSafetyImpact(conditions, visibility, lighting)
            };
        }

        detectWeatherConditions() {
            const conditions = [];
            const possibleConditions = [
                'clear', 'cloudy', 'overcast', 'rainy', 'foggy', 'snowy'
            ];
            
            // Randomly detect 1-2 conditions
            const numConditions = Math.random() > 0.7 ? 2 : 1;
            for (let i = 0; i < numConditions; i++) {
                const condition = possibleConditions[Math.floor(Math.random() * possibleConditions.length)];
                if (!conditions.includes(condition)) {
                    conditions.push(condition);
                }
            }
            
            return conditions;
        }

        assessVisibility() {
            const visibilityLevels = ['excellent', 'good', 'fair', 'poor', 'very_poor'];
            const level = visibilityLevels[Math.floor(Math.random() * visibilityLevels.length)];
            
            return {
                level: level,
                estimated_distance: this.getVisibilityDistance(level),
                factors: this.getVisibilityFactors(level)
            };
        }

        assessLighting() {
            const hour = new Date().getHours();
            let lightingLevel;
            
            if (hour >= 6 && hour <= 18) {
                lightingLevel = 'daylight';
            } else if (hour >= 19 && hour <= 21) {
                lightingLevel = 'twilight';
            } else {
                lightingLevel = 'artificial';
            }
            
            return {
                type: lightingLevel,
                adequacy: Math.random() > 0.3 ? 'adequate' : 'inadequate',
                shadows_present: Math.random() > 0.5,
                glare_detected: Math.random() > 0.8
            };
        }

        getVisibilityDistance(level) {
            const distances = {
                'excellent': '> 10 km',
                'good': '5-10 km',
                'fair': '1-5 km',
                'poor': '200m-1km',
                'very_poor': '< 200m'
            };
            return distances[level];
        }

        getVisibilityFactors(level) {
            if (level === 'poor' || level === 'very_poor') {
                return ['fog', 'precipitation', 'dust'];
            }
            return [];
        }

        calculateWeatherSeverity(conditions, visibility) {
            let severity = 0;
            
            if (conditions.includes('rainy')) severity += 2;
            if (conditions.includes('snowy')) severity += 3;
            if (conditions.includes('foggy')) severity += 2;
            if (visibility.level === 'poor') severity += 2;
            if (visibility.level === 'very_poor') severity += 3;
            
            if (severity >= 5) return 'high';
            if (severity >= 3) return 'medium';
            return 'low';
        }

        assessSafetyImpact(conditions, visibility, lighting) {
            const impacts = [];
            
            if (visibility.level === 'poor' || visibility.level === 'very_poor') {
                impacts.push('Reduced visibility increases collision risk');
            }
            
            if (conditions.includes('rainy')) {
                impacts.push('Wet surfaces increase slip hazard');
            }
            
            if (lighting.adequacy === 'inadequate') {
                impacts.push('Poor lighting reduces hazard detection');
            }
            
            return impacts;
        }
    }

    /**
     * 🛡️ Safety Equipment AI
     */
    class SafetyEquipmentAI {
        constructor() {
            this.equipmentTypes = [
                'fire_extinguisher', 'emergency_exit', 'first_aid_kit',
                'security_camera', 'emergency_phone', 'warning_sign',
                'safety_barrier', 'life_jacket', 'helmet_required_sign'
            ];
        }

        async initialize() {
            console.log('🛡️ Loading safety equipment detection model...');
        }

        async detect(imageData) {
            // Simulate safety equipment detection
            const equipment = [];
            const numEquipment = Math.floor(Math.random() * 4); // 0-3 items

            for (let i = 0; i < numEquipment; i++) {
                const equipmentType = this.equipmentTypes[Math.floor(Math.random() * this.equipmentTypes.length)];
                const confidence = 0.6 + Math.random() * 0.4;

                if (confidence >= 0.7) {
                    equipment.push({
                        type: equipmentType,
                        confidence: confidence,
                        location: this.estimateLocation(),
                        accessibility: this.assessAccessibility(equipmentType),
                        condition: this.assessCondition(),
                        safety_value: this.assessSafetyValue(equipmentType)
                    });
                }
            }

            return {
                detected_equipment: equipment,
                safety_coverage: this.assessSafetyCoverage(equipment),
                accessibility_score: this.calculateAccessibilityScore(equipment),
                recommendations: this.generateEquipmentRecommendations(equipment)
            };
        }

        estimateLocation() {
            const locations = ['nearby', 'visible', 'distant', 'partially_obscured'];
            return locations[Math.floor(Math.random() * locations.length)];
        }

        assessAccessibility(equipmentType) {
            const criticalEquipment = ['fire_extinguisher', 'emergency_exit', 'first_aid_kit'];
            if (criticalEquipment.includes(equipmentType)) {
                return Math.random() > 0.3 ? 'accessible' : 'blocked';
            }
            return 'accessible';
        }

        assessCondition() {
            const conditions = ['excellent', 'good', 'fair', 'poor'];
            return conditions[Math.floor(Math.random() * conditions.length)];
        }

        assessSafetyValue(equipmentType) {
            const valueMap = {
                'fire_extinguisher': 'high',
                'emergency_exit': 'critical',
                'first_aid_kit': 'high',
                'security_camera': 'medium',
                'emergency_phone': 'high',
                'warning_sign': 'medium'
            };
            return valueMap[equipmentType] || 'low';
        }

        assessSafetyCoverage(equipment) {
            const criticalTypes = ['emergency_exit', 'fire_extinguisher', 'first_aid_kit'];
            const presentCritical = equipment.filter(e => criticalTypes.includes(e.type));
            
            if (presentCritical.length >= 2) return 'good';
            if (presentCritical.length === 1) return 'adequate';
            return 'insufficient';
        }

        calculateAccessibilityScore(equipment) {
            if (equipment.length === 0) return 0;
            
            const accessibleCount = equipment.filter(e => e.accessibility === 'accessible').length;
            return (accessibleCount / equipment.length) * 100;
        }

        generateEquipmentRecommendations(equipment) {
            const recommendations = [];
            
            const blockedEquipment = equipment.filter(e => e.accessibility === 'blocked');
            if (blockedEquipment.length > 0) {
                recommendations.push('Clear access to blocked safety equipment');
            }
            
            const poorCondition = equipment.filter(e => e.condition === 'poor');
            if (poorCondition.length > 0) {
                recommendations.push('Report damaged safety equipment');
            }
            
            return recommendations;
        }
    }

    // Utility Methods
    assessImageQuality(imageData) {
        if (!imageData) return 'unavailable';
        
        // Simulate image quality assessment
        const brightness = Math.random();
        const sharpness = Math.random();
        const noise = Math.random();
        
        const qualityScore = (brightness + sharpness + (1 - noise)) / 3;
        
        if (qualityScore > 0.8) return 'excellent';
        if (qualityScore > 0.6) return 'good';
        if (qualityScore > 0.4) return 'fair';
        return 'poor';
    }

    calculateOverallSafetyScore(objects, hazards, crowdMetrics) {
        let score = 100; // Start with perfect score
        
        // Deduct for hazards
        hazards.forEach(hazard => {
            if (hazard.severity === 'critical') score -= 30;
            else if (hazard.severity === 'high') score -= 20;
            else if (hazard.severity === 'medium') score -= 10;
            else score -= 5;
        });
        
        // Deduct for crowd issues
        if (crowdMetrics.density_level === 'overcrowded') score -= 20;
        else if (crowdMetrics.density_level === 'dense') score -= 10;
        
        if (crowdMetrics.behavior_analysis === 'agitated') score -= 15;
        else if (crowdMetrics.behavior_analysis === 'chaotic') score -= 10;
        
        // Deduct for high-risk objects
        const highRiskObjects = objects.filter(obj => obj.risk_level === 'high');
        score -= highRiskObjects.length * 5;
        
        return Math.max(0, Math.min(100, score));
    }

    generateVisualRecommendations(objects, hazards, crowdMetrics) {
        const recommendations = [];
        
        // Hazard-based recommendations
        const criticalHazards = hazards.filter(h => h.severity === 'critical');
        if (criticalHazards.length > 0) {
            recommendations.push('🚨 Critical hazards detected - avoid area immediately');
        }
        
        // Crowd-based recommendations
        if (crowdMetrics.density_level === 'overcrowded') {
            recommendations.push('👥 Area is overcrowded - consider alternative route');
        }
        
        // Object-based recommendations
        const vehicles = objects.filter(obj => ['car', 'truck', 'bus'].includes(obj.class));
        if (vehicles.length > 3) {
            recommendations.push('🚗 Heavy traffic detected - exercise extra caution');
        }
        
        return recommendations;
    }

    dispatchAnalysisEvent(analysis) {
        // Dispatch custom event for integration with main application
        window.dispatchEvent(new CustomEvent('visionAnalysis', {
            detail: analysis
        }));
    }

    // Public API Methods
    async captureAndAnalyze() {
        return await this.performAnalysis();
    }

    isAvailable() {
        return this.isInitialized && this.camera && this.videoStream;
    }

    getVideoElement() {
        return this.camera;
    }

    cleanup() {
        this.stopAnalysis();
        
        if (this.videoStream) {
            this.videoStream.getTracks().forEach(track => track.stop());
        }
        
        console.log('🧹 AI Vision System cleaned up');
    }
}

// Export for use in main application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIVisionSystem;
}

if (typeof window !== 'undefined') {
    window.AIVisionSystem = AIVisionSystem;
}