import ActivityKit
import WidgetKit
import SwiftUI

// ============================================================================
// AuraTaskLiveActivity — the lock-screen card + Dynamic Island for a live
// focus session. Mirrors the in-app ActiveTaskWidget. The countdown bar uses
// ProgressView(timerInterval:) so it animates natively with no push updates;
// when paused we fall back to a static bar + frozen remaining time.
//
// Palette is hardcoded here on purpose — widget extensions can't import the
// app's TS Colors constant. Values match packages/shared/constants/colors.ts.
// ============================================================================

@available(iOS 16.2, *)
enum AuraPalette {
  static let bgDark = Color(red: 0.039, green: 0.067, blue: 0.094)      // #0A1118
  static let mist = Color(red: 0.659, green: 0.855, blue: 0.863)        // #A8DADC
  static let textPrimary = Color(red: 0.945, green: 0.980, blue: 0.933) // #F1FAEE
  static let textSecondary = Color(red: 0.557, green: 0.686, blue: 0.761) // #8EAFC2
  static let green = Color(red: 0.494, green: 0.812, blue: 0.627)       // #7ECFA0
  static let amber = Color(red: 0.957, green: 0.635, blue: 0.380)       // #F4A261
  static let red = Color(red: 0.906, green: 0.435, blue: 0.435)         // #E76F6F

  static func difficultyColor(_ level: Int) -> Color {
    if level <= 2 { return green }
    if level == 3 { return amber }
    return red
  }
}

@available(iOS 16.2, *)
struct AuraTaskLiveActivity: Widget {
  var body: some WidgetConfiguration {
    ActivityConfiguration(for: AuraTaskAttributes.self) { context in
      LockScreenView(state: context.state)
        .activityBackgroundTint(AuraPalette.bgDark)
        .activitySystemActionForegroundColor(AuraPalette.mist)
    } dynamicIsland: { context in
      let accent = AuraPalette.difficultyColor(context.state.difficulty)
      return DynamicIsland {
        DynamicIslandExpandedRegion(.leading) {
          Text(context.state.subject.uppercased())
            .font(.caption2.weight(.semibold))
            .foregroundStyle(AuraPalette.textSecondary)
        }
        DynamicIslandExpandedRegion(.trailing) {
          CountdownText(state: context.state)
            .font(.caption.weight(.semibold))
            .foregroundStyle(AuraPalette.textPrimary)
        }
        DynamicIslandExpandedRegion(.bottom) {
          VStack(alignment: .leading, spacing: 8) {
            Text(context.state.title)
              .font(.footnote.weight(.semibold))
              .foregroundStyle(AuraPalette.textPrimary)
              .lineLimit(1)
            ProgressLine(state: context.state, accent: accent)
          }
        }
      } compactLeading: {
        Image(systemName: context.state.paused ? "pause.fill" : "timer")
          .foregroundStyle(accent)
      } compactTrailing: {
        CountdownText(state: context.state)
          .font(.caption2.weight(.semibold))
          .foregroundStyle(AuraPalette.textPrimary)
          .monospacedDigit()
      } minimal: {
        Image(systemName: context.state.paused ? "pause.fill" : "timer")
          .foregroundStyle(accent)
      }
      .keylineTint(accent)
    }
  }
}

// MARK: - Lock screen / banner

@available(iOS 16.2, *)
private struct LockScreenView: View {
  let state: AuraTaskAttributes.ContentState

  var body: some View {
    let accent = AuraPalette.difficultyColor(state.difficulty)
    VStack(alignment: .leading, spacing: 12) {
      HStack(alignment: .top) {
        VStack(alignment: .leading, spacing: 4) {
          Text(state.subject.uppercased())
            .font(.caption2.weight(.semibold))
            .tracking(1.5)
            .foregroundStyle(AuraPalette.textSecondary)
          Text(state.title)
            .font(.headline.weight(.semibold))
            .foregroundStyle(AuraPalette.textPrimary)
            .lineLimit(2)
        }
        Spacer(minLength: 12)
        CountdownText(state: state)
          .font(.title3.weight(.bold))
          .monospacedDigit()
          .foregroundStyle(state.paused ? AuraPalette.textSecondary : AuraPalette.textPrimary)
      }
      ProgressLine(state: state, accent: accent)
      Text(state.paused ? "Paused" : "Focusing")
        .font(.caption2.weight(.medium))
        .foregroundStyle(AuraPalette.textSecondary)
    }
    .padding(16)
  }
}

// MARK: - Shared pieces

/// The glowing "river" progress line. Animates itself while running via
/// timerInterval; renders a static fill when paused.
@available(iOS 16.2, *)
private struct ProgressLine: View {
  let state: AuraTaskAttributes.ContentState
  let accent: Color

  var body: some View {
    Group {
      if state.paused {
        ProgressView(value: pausedFraction)
      } else {
        ProgressView(timerInterval: state.startsAt...state.endsAt, countsDown: false) {
          EmptyView()
        } currentValueLabel: {
          EmptyView()
        }
      }
    }
    .progressViewStyle(.linear)
    .tint(accent)
    .frame(height: 4)
  }

  private var pausedFraction: Double {
    let total = state.endsAt.timeIntervalSince(state.startsAt)
    guard total > 0 else { return 0 }
    let done = total - (state.remainingMs / 1000.0)
    return min(max(done / total, 0), 1)
  }
}

/// Live countdown text. Uses the system timer text while running (updates on
/// its own), and a formatted static value while paused.
@available(iOS 16.2, *)
private struct CountdownText: View {
  let state: AuraTaskAttributes.ContentState

  var body: some View {
    if state.paused {
      Text(Self.format(ms: state.remainingMs))
    } else {
      Text(timerInterval: Date()...state.endsAt, countsDown: true)
        .multilineTextAlignment(.trailing)
    }
  }

  static func format(ms: Double) -> String {
    let totalSeconds = max(0, Int(ms / 1000.0))
    let minutes = totalSeconds / 60
    let seconds = totalSeconds % 60
    return String(format: "%d:%02d", minutes, seconds)
  }
}
