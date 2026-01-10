"""
Favorites model for Knowledge Repository
"""

from db import query


class Favorites:
    @staticmethod
    def get_user_favorites(user_id):
        result = query(
            'SELECT article_id FROM user_favorites WHERE user_id = %s ORDER BY created_at DESC',
            (user_id,)
        )
        return [row['article_id'] for row in result['rows']]
    
    @staticmethod
    def add_favorite(user_id, article_id):
        query(
            'INSERT INTO user_favorites (user_id, article_id) VALUES (%s, %s) ON CONFLICT DO NOTHING',
            (user_id, article_id)
        )
        return {'success': True}
    
    @staticmethod
    def remove_favorite(user_id, article_id):
        query(
            'DELETE FROM user_favorites WHERE user_id = %s AND article_id = %s',
            (user_id, article_id)
        )
        return {'success': True}
    
    @staticmethod
    def is_favorited(user_id, article_id):
        result = query(
            'SELECT 1 FROM user_favorites WHERE user_id = %s AND article_id = %s',
            (user_id, article_id)
        )
        return len(result['rows']) > 0
