import React from 'react';
import { useTranslation } from 'react-i18next';
import { Star } from '@utils/icons';

export const DayHeroHeader = React.memo(({
    dayNumber,
    prevDayNumber,
    isCounterTransitioning,
    isDayPerfect,
    isFuture,
    effectiveStart,
    hidden
}) => {
    const { t } = useTranslation();

    if (hidden) return null;

    let dayNumAnimation = '';
    if (isCounterTransitioning) {
        dayNumAnimation = isDayPerfect
            ? 'gradientShift 4s ease infinite, counterSlideUp 0.8s ease-out'
            : 'rainbowFlow 6s ease infinite, counterSlideUp 0.8s ease-out';
    } else {
        dayNumAnimation = isDayPerfect
            ? 'gradientShift 4s ease infinite, numberRoll 0.5s ease-out'
            : 'rainbowFlow 6s ease infinite, numberRoll 0.5s ease-out';
    }

    let prevDayNumAnimation = '';
    if (isDayPerfect) {
        prevDayNumAnimation = 'gradientShift 4s ease infinite, counterSlideDown 0.8s ease-out forwards';
    } else {
        prevDayNumAnimation = 'rainbowFlow 6s ease infinite, counterSlideDown 0.8s ease-out forwards';
    }

    return (
        <div
            className="day-hero-header-container flex-col flex-center pos-relative"
            style={{
                width: '100%',
                paddingTop: 'clamp(4px, 1vh, 8px)',
                paddingBottom: 0,
                zIndex: 2,
                transition: 'opacity 0.3s ease, transform 0.3s ease',
                opacity: hidden ? 0 : 1,
                pointerEvents: hidden ? 'none' : 'auto'
            }}
        >
            {isDayPerfect && (
                <>
                    {[
                        { top: '5%', left: '30%', size: 10, delay: '0s' },
                        { top: '15%', right: '30%', size: 8, delay: '1s' },
                        { bottom: '10%', left: '25%', size: 9, delay: '2s' },
                        { bottom: '15%', right: '25%', size: 7, delay: '3.5s' }
                    ].map((s, idx) => (
                        <Star
                            key={idx}
                            className="sparkle-icon"
                            size={s.size}
                            fill="#FFD700"
                            style={{
                                position: 'absolute',
                                top: s.top, left: s.left, right: s.right, bottom: s.bottom,
                                animationDelay: s.delay, opacity: 0.5
                            }}
                        />
                    ))}
                </>
            )}

            {!isFuture ? (
                <div style={{ textAlign: 'center', position: 'relative', width: '100%' }}>
                    {/* Day label badge with elegant slide down */}
                    <div style={{
                        fontSize: 'var(--day-label-size, clamp(0.7rem, 1.5vh, 0.85rem))',
                        lineHeight: 1.2,
                        color: isDayPerfect ? '#ffdf00' : 'var(--text-secondary)',
                        textTransform: 'uppercase', letterSpacing: '4px',
                        marginBottom: '2px', fontWeight: '700',
                        textShadow: isDayPerfect ? '0 0 8px rgba(255,223,0,0.4)' : 'none',
                        animation: 'heroLabelSlide 0.5s ease-out'
                    }} className="day-label">
                        <span className="day-label-text">{t('dashboard.day')}</span>
                    </div>

                    {/* Big animated day number inside hero pod */}
                    <div className="flex-center pos-relative day-number-container" style={{
                        minHeight: 'var(--day-num-height, clamp(2.2rem, 7vh, 4.8rem))',
                        padding: '2px 12px 0px 12px',
                        marginBottom: '0',
                        overflow: 'visible',
                        filter: isDayPerfect ? 'drop-shadow(0 2px 10px rgba(251,191,36,0.3))' : 'drop-shadow(0 2px 10px rgba(168,85,247,0.2))'
                    }}>
                        {isCounterTransitioning && prevDayNumber && (
                            <div className={`day-number-anim ${isDayPerfect ? 'gold-text' : 'rainbow-gradient'}`} style={{
                                position: 'absolute', fontSize: 'var(--day-num-font-size, clamp(2rem, 6.5vh, 4.5rem))', fontWeight: '800', lineHeight: 1.1,
                                animation: prevDayNumAnimation, padding: '0 8px'
                            }}>
                                {prevDayNumber}
                            </div>
                        )}
                        <div
                            key={dayNumber}
                            className={`day-number ${isDayPerfect ? 'gold-text' : 'rainbow-gradient'}`}
                            data-text={dayNumber}
                            style={{
                                fontSize: 'var(--day-num-font-size, clamp(2rem, 6.5vh, 4.5rem))', fontWeight: '800', lineHeight: 1.1,
                                animation: dayNumAnimation, padding: '0 8px'
                            }}
                        >
                            {dayNumber}
                        </div>
                    </div>
                </div>
            ) : (
                <div style={{ textAlign: 'center', color: 'var(--text-secondary)', fontSize: '0.85rem', fontWeight: '600' }}>
                    {t('dashboard.challengeStarts')} <strong style={{ color: 'var(--text-primary)' }}>{effectiveStart}</strong>
                </div>
            )}
        </div>
    );
});
