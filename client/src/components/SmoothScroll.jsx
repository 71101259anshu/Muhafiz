import { ReactLenis } from 'lenis/react';
import 'lenis/dist/lenis.css';

const SmoothScroll = ({ children }) => {
    return (
        <ReactLenis root options={{
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            direction: 'vertical',
            gestureDirection: 'vertical',
            smooth: true,
            mouseMultiplier: 1,
            smoothTouch: false,
            touchMultiplier: 2,
        }}>
            {children}
        </ReactLenis>
    );
};

export default SmoothScroll;
