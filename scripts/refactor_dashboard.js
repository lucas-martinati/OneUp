const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../src/components/Dashboard.jsx');
let content = fs.readFileSync(filePath, 'utf-8');

const mainStart = content.indexOf('<main style={{');
const mainEnd = content.indexOf('</main>') + '</main>'.length;

const mainOriginalContent = content.substring(mainStart, mainEnd);

// Extract the inner content of <main> to create DashboardSlide.
// Because the inner content was inside <main> we need to grab the "!isFuture" block.
const slideBodyStart = mainOriginalContent.indexOf('{!isFuture ? (');
const slideBodyEnd = mainOriginalContent.lastIndexOf(')}'); // closing of target isFuture block
const slideBody = mainOriginalContent.substring(slideBodyStart, slideBodyEnd + 2); // gets the whole tertiary expression

// Now replace references to selectedExerciseId
let slideBodyAdjusted = slideBody.replace(/selectedExerciseId/g, 'activeExerciseId');
// Replace the map of EXERCISES.map(ex => ...)
slideBodyAdjusted = slideBodyAdjusted.replace(/EXERCISES\.map\(ex/g, 'exercisesList.map(ex');
// The onSelect must map to the new prop
slideBodyAdjusted = slideBodyAdjusted.replace(/onSelect={handleSelectExercise}/g, 'onSelect={onSelectExercise}');
// Instead of selectedExercise, which might be undefined, use a local safeSelectedExercise
slideBodyAdjusted = slideBodyAdjusted.replace(/selectedExercise\./g, 'safeSelectedExercise.');

const newMainContent = `
                <main style={{
                    flex: 1, display: 'flex', flexDirection: 'column',
                    minHeight: 0, position: 'relative'
                }}>
                    <div 
                        onScroll={(e) => {
                            const slideHeight = e.target.clientHeight;
                            if (slideHeight === 0) return;
                            const newSlide = Math.round(e.target.scrollTop / slideHeight);
                            if (newSlide >= 0 && newSlide <= 2) {
                                document.getElementById('active-slide-updater').click();
                                window.__latestSlide = newSlide;
                            }
                        }}
                        style={{
                            flex: 1, overflowY: 'auto', overflowX: 'hidden',
                            scrollSnapType: 'y mandatory', scrollBehavior: 'smooth',
                            display: 'flex', flexDirection: 'column', width: '100%',
                            scrollbarWidth: 'none', msOverflowStyle: 'none'
                        }}
                    >
                        <button id="active-slide-updater" style={{display:'none'}} onClick={() => {
                            if (window.__latestSlide !== undefined && window.__latestSlide !== activeSlide) {
                                setActiveSlide(window.__latestSlide);
                            }
                        }}></button>

                        <div style={{ flex: '0 0 100%', scrollSnapAlign: 'start', height: '100%' }}>
                            <DashboardSlide
                                isFuture={isFuture} effectiveStart={effectiveStart} dayNumber={dayNumber} today={today} settings={settings}
                                getExerciseCount={getExerciseCount} completions={completions} computedStats={computedStats}
                                isCounterTransitioning={isCounterTransitioning} prevDayNumber={prevDayNumber} numberKey={numberKey}
                                pauseCloudSync={pauseCloudSync} setShowCounter={setShowCounter}
                                activeExerciseId={classicSelected} onSelectExercise={handleSelectExercise}
                                exercisesList={EXERCISES} exercisesMap={EXERCISES_MAP}
                            />
                        </div>

                        {isPro && (
                            <div style={{ flex: '0 0 100%', scrollSnapAlign: 'start', height: '100%' }}>
                                <DashboardSlide
                                    title="Musculation (Poids)"
                                    isFuture={isFuture} effectiveStart={effectiveStart} dayNumber={dayNumber} today={today} settings={settings}
                                    getExerciseCount={getExerciseCount} completions={completions} computedStats={computedStats}
                                    isCounterTransitioning={isCounterTransitioning} prevDayNumber={prevDayNumber} numberKey={numberKey}
                                    pauseCloudSync={pauseCloudSync} setShowCounter={setShowCounter}
                                    activeExerciseId={weightsSelected} onSelectExercise={handleSelectExercise}
                                    exercisesList={WEIGHT_EXERCISES} exercisesMap={WEIGHT_EXERCISES_MAP}
                                />
                            </div>
                        )}

                        {isPro && (
                            <div style={{ flex: '0 0 100%', scrollSnapAlign: 'start', height: '100%' }}>
                                <DashboardSlide
                                    title="Exercices Personnalisés"
                                    isFuture={isFuture} effectiveStart={effectiveStart} dayNumber={dayNumber} today={today} settings={settings}
                                    getExerciseCount={getExerciseCount} completions={completions} computedStats={computedStats}
                                    isCounterTransitioning={isCounterTransitioning} prevDayNumber={prevDayNumber} numberKey={numberKey}
                                    pauseCloudSync={pauseCloudSync} setShowCounter={setShowCounter}
                                    activeExerciseId={customSelected} onSelectExercise={handleSelectExercise}
                                    exercisesList={[]} exercisesMap={{}}
                                />
                            </div>
                        )}
                    </div>

                    {isPro && (
                        <div style={{
                            position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)',
                            display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 10,
                            pointerEvents: 'none'
                        }}>
                            {[0, 1, 2].map(i => (
                                <div key={i} style={{
                                    width: '4px', height: activeSlide === i ? '24px' : '6px',
                                    borderRadius: '4px',
                                    background: activeSlide === i ? 'var(--text-primary)' : 'var(--text-secondary)',
                                    opacity: activeSlide === i ? 1 : 0.4,
                                    transition: 'all 0.3s ease'
                                }} />
                            ))}
                        </div>
                    )}
                </main>`;

content = content.replace(mainOriginalContent, newMainContent);

// Add the new component DashboardSlide
const dashboardSlideComponent = `
const DashboardSlide = React.memo(({
    isFuture, effectiveStart, dayNumber, today, settings, getExerciseCount, completions, computedStats,
    isCounterTransitioning, prevDayNumber, numberKey, pauseCloudSync, setShowCounter,
    activeExerciseId, onSelectExercise, exercisesList, exercisesMap, title
}) => {
    const { t } = useTranslation();
    const safeSelectedExercise = exercisesMap[activeExerciseId] || exercisesList[0];
    
    if (!safeSelectedExercise) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '20px', textAlign: 'center' }}>
                {title && <h2 style={{ fontSize: '1.2rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>{title}</h2>}
                <div style={{ color: 'var(--text-muted)' }}>Vous n'avez pas encore configuré d'exercices ici.</div>
            </div>
        );
    }

    const { getDailyGoal } = require('../config/exercises');
    const dailyGoal = getDailyGoal(safeSelectedExercise, dayNumber, settings?.difficultyMultiplier) || 1;
    const currentCount = getExerciseCount(today, safeSelectedExercise.id);
    const isExerciseDone = completions[today]?.[safeSelectedExercise.id]?.isCompleted || currentCount >= dailyGoal;
    const progress = Math.min((dayNumber / 365) * 100, 100);

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = (seconds % 60).toString().padStart(2, '0');
        return \`\${m}:\${s}\`;
    };

    return (
        <div style={{
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 'clamp(4px, 0.8vh, 12px)',
            height: '100%', width: '100%', paddingTop: title ? '12px' : '0'
        }}>
            {title && (
                <div style={{ fontSize: '0.8rem', fontWeight: '800', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.8 }}>
                    {title}
                </div>
            )}
            ${slideBodyAdjusted}
        </div>
    );
});
`;

content += dashboardSlideComponent;
content = content.replace("const { getDailyGoal } = require('../config/exercises');", "");

fs.writeFileSync(filePath, content, 'utf-8');
console.log("Refactoring complete");
