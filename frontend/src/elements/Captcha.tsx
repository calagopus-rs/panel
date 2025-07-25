import { useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { useGlobalStore } from '@/stores/global';
import { Turnstile } from '@marsidev/react-turnstile';
import ReCAPTCHA from 'react-google-recaptcha';

const Captcha = forwardRef((_, ref) => {
  const settings = useGlobalStore((state) => state.settings);
  const captchaProvider = settings?.captchaProvider;
  const turnstileRef = useRef(null);
  const recaptchaRef = useRef(null);

  // Expose getToken and resetCaptcha
  useImperativeHandle(ref, () => ({
    getToken: async () => {
      if (captchaProvider?.type === 'turnstile') {
        return turnstileRef.current?.getResponse?.();
      }

      if (captchaProvider?.type === 'recaptcha') {
        if (captchaProvider.v3) {
          if (!window.grecaptcha || !captchaProvider.siteKey) return null;
          try {
            return await window.grecaptcha.execute(captchaProvider.siteKey, { action: 'submit' });
          } catch (err) {
            console.error('reCAPTCHA v3 error:', err);
            return null;
          }
        } else {
          return recaptchaRef.current?.getValue?.();
        }
      }

      return null;
    },

    resetCaptcha: () => {
      if (captchaProvider?.type === 'turnstile') {
        turnstileRef.current?.reset?.();
      } else if (captchaProvider?.type === 'recaptcha' && !captchaProvider.v3) {
        recaptchaRef.current?.reset?.();
      }
    },
  }));

  // Load reCAPTCHA v3 script dynamically
  useEffect(() => {
    if (captchaProvider?.type === 'recaptcha' && captchaProvider.v3) {
      const existingScript = document.querySelector('#recaptcha-v3-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'recaptcha-v3-script';
        script.src = `https://www.google.com/recaptcha/api.js?render=${captchaProvider.siteKey}`;
        script.async = true;
        document.body.appendChild(script as unknown as Node);
      }
    }
  }, [captchaProvider]);

  if (captchaProvider?.type === 'turnstile') {
    return <Turnstile siteKey={captchaProvider.siteKey} ref={turnstileRef} />;
  }

  if (captchaProvider?.type === 'recaptcha') {
    if (captchaProvider.v3) {
      return null; // reCAPTCHA v3 is loaded dynamically
    }

    return <ReCAPTCHA sitekey={captchaProvider.siteKey} ref={recaptchaRef} size={'normal'} />;
  }

  return null;
});

export default Captcha;
