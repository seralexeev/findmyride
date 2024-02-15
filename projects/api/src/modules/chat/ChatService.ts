import { array } from '@untype/toolbox';
import { singleton } from 'tsyringe';
import { Context } from '../models/context';

@singleton()
export class ChatService {
    public addToRoom = async (ctx: Context, { userId, roomId }: { userId: string; roomId: string }) => {
        await ctx.t.sql`
            INSERT INTO user2rooms (user_id, room_id) 
            VALUES (${userId}, ${roomId}) 
            ON CONFLICT (user_id, room_id) DO NOTHING
        `;
    };

    public kickFromRoom = async (ctx: Context, { userId, roomId }: { userId: string; roomId: string }) => {
        await ctx.t.sql`
            DELETE FROM user2rooms
            WHERE user_id = ${userId} AND room_id = ${roomId}
        `;
    };

    public updateLastSeenMessage = async (ctx: Context, roomId: string) => {
        await ctx.t.sql`
            UPDATE user2rooms 
            SET last_seen_message_id = (
                SELECT id
                FROM messages
                WHERE room_id = ${roomId}
                ORDER BY created_at DESC
                LIMIT 1
            )
            WHERE user_id = ${ctx.user.id} AND room_id = ${roomId}
        `;
    };

    public getUnreadMessagesCount = async (ctx: Context) => {
        const count = await ctx.t.sql<{ count: number }>`
            SELECT COUNT(*) AS count
            FROM
                chat_rooms AS r
                LEFT JOIN user2rooms AS u2r ON u2r.room_id = r.id
                LEFT JOIN messages AS m ON u2r.last_seen_message_id = m.id
                LEFT JOIN messages AS mm ON r.id = mm.room_id AND (m.created_at IS NULL OR mm.created_at > m.created_at)
            WHERE TRUE
                AND mm IS NOT NULL
                AND u2r.user_id = ${ctx.user.id}
        `.then((res) => res[0]?.count ?? 0);

        return { count };
    };

    public getUnreadMessagesCountForRooms = async (ctx: Context, rooms: string[]) => {
        const counts = await ctx.t.sql<{ count: number; roomId: string }>`
            SELECT 
                COUNT(*) AS count,
                r.id AS "roomId"
            FROM
                chat_rooms AS r
                LEFT JOIN user2rooms AS u2r ON u2r.room_id = r.id
                LEFT JOIN messages AS m ON u2r.last_seen_message_id = m.id
                LEFT JOIN messages AS mm ON r.id = mm.room_id AND (m.created_at IS NULL OR mm.created_at > m.created_at)
            WHERE TRUE
                AND mm IS NOT NULL
                AND u2r.user_id = ${ctx.user.id}
                AND r.id = ANY(${rooms}::uuid[])
            GROUP BY r.id
        `.then((res) => {
            return array.reduceBy(
                res,
                (x) => x.roomId,
                (x) => x.count,
            );
        });

        return array.reduceBy(
            rooms,
            (x: string) => x,
            (x) => counts[x] ?? 0,
        );
    };
}
