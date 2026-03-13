@import UIKit;

static void showAlert(NSString *title, NSString *message);

@interface SpringBoard : UIApplication
+ (SpringBoard *)sharedApplication;
- (void)initStatusBarGesture;
- (void)ensureStatusBarGestureWithRetry:(NSInteger)attempt;
- (void)showInjectedAlert;
- (void)showInjectedAlertWhenReady:(NSInteger)attempt;
- (UIView *)statusBarForEmbeddedDisplay;
+ (UIViewController *)viewControllerToPresent;
@end
