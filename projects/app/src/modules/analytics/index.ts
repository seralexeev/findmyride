// TODO: add analytics context
// TODO: add analytics provider
export const analytics = {
    logScreen: (name: string) => {
        // void firebaseAnalytics().logScreenView({
        //     screen_class: name,
        //     screen_name: name,
        // });
    },
    logEvent: (name: string, params?: Record<string, string>) => {
        // void firebaseAnalytics().logEvent(name, params);
    },
    logAppOpen: () => {
        // void firebaseAnalytics().logAppOpen();
    },
    logSignUp: (args: { method: string }) => {
        // void firebaseAnalytics().logSignUp(args);
    },
    logLogin: (args: { method: string }) => {
        // void firebaseAnalytics().logLogin(args);
    },
    logSelectContent: (args: { id: string; type: string }) => {
        // void firebaseAnalytics().logSelectContent({ content_type: args.type, item_id: args.id });
    },
};
