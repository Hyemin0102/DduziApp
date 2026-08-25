import {Mixpanel} from 'mixpanel-react-native';
import Config from 'react-native-config';

const TRACK_AUTOMATIC_EVENTS = false;

export const mixpanel = new Mixpanel(Config.MIXPANEL_TOKEN!, TRACK_AUTOMATIC_EVENTS);
mixpanel.init();

export const trackEvent = (name: string, properties?: Record<string, unknown>) => {
  mixpanel.track(name, properties);
};

export const identifyUser = (userId: string, properties?: Record<string, unknown>) => {
  mixpanel.identify(userId);
  if (properties) mixpanel.getPeople().set(properties);
};

export const resetUser = () => {
  mixpanel.reset();
};

export const trackScreenView = (screenName: string) => {
  trackEvent('screen_viewed', {screen_name: screenName});
};

export const trackAppOpened = () => {
  trackEvent('app_opened');
};
