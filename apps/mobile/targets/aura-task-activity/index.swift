import WidgetKit
import SwiftUI

// Entry point for the widget extension bundle. Aura ships only the Live
// Activity today; add additional widgets to this bundle as they're built.
@main
struct AuraTaskActivityBundle: WidgetBundle {
  var body: some Widget {
    if #available(iOS 16.2, *) {
      AuraTaskLiveActivity()
    }
  }
}
