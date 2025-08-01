class NotificationService:
    @staticmethod
    def send_order_status_update(user_id, order_id, new_status):
        # In a real application, this would send an email, push notification, etc.
        print(f"Notification: User {user_id}, Order {order_id} status updated to {new_status}")

    @staticmethod
    def send_analysis_completion_notification(user_id, order_id, analysis_result_summary):
        print(f"Notification: User {user_id}, Analysis for Order {order_id} completed. Summary: {analysis_result_summary}")

    @staticmethod
    def send_payment_confirmation(user_id, order_id, amount):
        print(f"Notification: User {user_id}, Payment of {amount} confirmed for Order {order_id}")