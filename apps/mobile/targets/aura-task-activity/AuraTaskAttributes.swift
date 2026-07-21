import ActivityKit
import Foundation

// ============================================================================
// AuraTaskAttributes (widget-extension copy)
//
// ⚠️ This MUST stay byte-identical to the canonical definition at
// `modules/aura-live-activity/ios/AuraTaskAttributes.swift`. ActivityKit
// matches activities by attribute type, so the app target and this widget
// extension must compile the same shape. Preferred long-term fix: share one
// file via target membership instead of duplicating. See the module README.
// ============================================================================

@available(iOS 16.2, *)
public struct AuraTaskAttributes: ActivityAttributes {
  public struct ContentState: Codable, Hashable {
    public var title: String
    public var subject: String
    public var difficulty: Int
    public var startsAt: Date
    public var endsAt: Date
    public var paused: Bool
    public var remainingMs: Double
    public var status: String

    public init(
      title: String,
      subject: String,
      difficulty: Int,
      startsAt: Date,
      endsAt: Date,
      paused: Bool,
      remainingMs: Double,
      status: String
    ) {
      self.title = title
      self.subject = subject
      self.difficulty = difficulty
      self.startsAt = startsAt
      self.endsAt = endsAt
      self.paused = paused
      self.remainingMs = remainingMs
      self.status = status
    }
  }

  public var taskId: String

  public init(taskId: String) {
    self.taskId = taskId
  }
}
