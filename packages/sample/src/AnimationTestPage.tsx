import * as React from 'react';
import { XView } from 'react-mental';
// import foo from './logo.png';
import { FastAnimatedContainer, capabilities } from 'fast-animations';

const HeavyElement = React.memo(() => {
    let children: any[] = [];
    for (let i = 0; i < 10000; i++) {
        children.push((<XView key={'k-' + i} width={1} height={1} backgroundColor={i % 2 === 0 ? 'blue' : 'green'} />));
    }
    return (
        <XView
            width={100}
            height={100}
            backgroundColor="red"
            flexWrap="wrap"
        >
            {children}
        </XView>
    );
});

export const AnimationTestPage = React.memo(() => {
    const [animationMode, setAnimationMode] = React.useState<'adaptive' | 'css-property' | 'web-animations' | 'animation-worklet' | 'css-animations'>('adaptive');
    const [offset, setOffset] = React.useState(0);
    const [mode, setMode] = React.useState(false);
    const startAnimation = React.useCallback(() => {
        setOffset((o) => {
            if (o === 0) {
                return 100;
            } else {
                return 0;
            }
        });
    }, []);

    const startAnimationBlocking = React.useCallback(() => {
        setOffset((o) => {
            if (o === 0) {
                return 100;
            } else {
                return 0;
            }
        });
        setTimeout(() => {
            let start = Date.now();
            while (Date.now() - start < 450) {
                ;
            }
        }, 100);
    }, []);

    const startAnimationBlockingLayout = React.useCallback(() => {
        setOffset((o) => {
            if (o === 0) {
                return 100;
            } else {
                return 0;
            }
        });
        setTimeout(() => {
            setMode((m) => !m);
        }, 50);
    }, []);

    return (
        <XView flexDirection="column" alignItems="center">
            <XView flexDirection="row" justifyContent="center" alignSelf="stretch">
                <XView
                    maxWidth={600}
                    flexGrow={1}
                    flexDirection="column"
                >
                    <XView flexDirection="column" backgroundColor="#0F4C81">
                        <XView
                            flexDirection="row"
                            height={48}
                            fontSize={20}
                            alignSelf="center"
                            alignItems="center"
                            color="white"
                        >
                            <span>Fast Animations Test</span>
                        </XView>
                    </XView>

                    <XView flexDirection="column" height={64} alignItems="flex-start" justifyContent="center">
                        <span>Current Mode: {animationMode}</span>
                        <span>WAAPI Supported: {'' + capabilities.waapiSupported}</span>
                        <span>Worklet Animations Supported: {'' + capabilities.workletSupported}</span>
                    </XView>

                    <XView flexDirection="row" height={48} alignItems="center">
                        <button onClick={() => setAnimationMode('adaptive')}>Adaptive</button>
                        <button onClick={() => setAnimationMode('css-property')}>CSS Properties</button>
                        <button onClick={() => setAnimationMode('css-animations')}>CSS Animation</button>
                        <button onClick={() => setAnimationMode('web-animations')}>Web Animations API</button>
                        <button onClick={() => setAnimationMode('animation-worklet')}>Worklet API</button>
                    </XView>

                    <XView flexDirection="row" height={48} alignItems="center">
                        <button onClick={startAnimation}>Test</button>
                        <button onClick={startAnimationBlocking}>Test Blocking JS</button>
                        <button onClick={startAnimationBlockingLayout}>Test Blocking Layout</button>
                    </XView>

                    <XView
                        width={200}
                        height={100}
                        key={animationMode}
                        backgroundColor="red"
                    >
                        <FastAnimatedContainer
                            mode={animationMode}
                            translateX={offset}
                            easing={'cubic-bezier(0.4, 0.0, 0.2, 1)'}
                            duration={100}
                        >
                            {mode && <XView
                                width={100}
                                height={100}
                                // src={foo}
                                backgroundColor="#0F4C81"
                            />}
                            {!mode && <HeavyElement />}
                        </FastAnimatedContainer>
                    </XView>
                </XView>
            </XView>
        </XView>
    );
});