"use client";
import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { getAuthToken } from '@/lib/auth';
import { Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function PropertyComments({ propertyId, isOwner, isAdmin }: { propertyId: string, isOwner: boolean, isAdmin: boolean }) {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const { user } = useAuth();

  useEffect(() => {
    if (propertyId) {
      api.get(`/properties/${propertyId}/comments`)
        .then(res => setComments(res.data))
        .catch(() => {});
    }
  }, [propertyId]);

  const submitComment = async (parentId?: string) => {
    const content = parentId ? replyContent : newComment;
    if (!content.trim()) {
      showToast('Vui lòng nhập nội dung');
      return;
    }
    if (!getAuthToken()) {
      showToast('Vui lòng đăng nhập');
      return;
    }
    try {
      const res = await api.post(`/properties/${propertyId}/comments`, { content, parentId });
      setComments([res.data, ...comments]);
      if (parentId) {
        setReplyContent('');
        setReplyingTo(null);
      } else {
        setNewComment('');
      }
      showToast('Đã gửi bình luận');
    } catch {
      showToast('Lỗi khi gửi bình luận');
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!confirm('Bạn có chắc muốn xóa bình luận này?')) return;
    try {
      await api.delete(`/properties/${propertyId}/comments/${commentId}`);
      setComments(comments.filter(c => c.id !== commentId));
      showToast('Đã xóa bình luận');
    } catch {
      showToast('Lỗi khi xóa bình luận');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Build tree
  const buildTree = (comments: any[]) => {
    const map = new Map();
    const roots: any[] = [];
    comments.forEach(c => map.set(c.id, { ...c, children: [] }));
    comments.forEach(c => {
      if (c.parentId) {
        const parent = map.get(c.parentId);
        if (parent) {
          parent.children.push(map.get(c.id));
        } else {
          roots.push(map.get(c.id));
        }
      } else {
        roots.push(map.get(c.id));
      }
    });
    return roots;
  };

  const commentTree = buildTree(comments);

  const CommentNode = ({ comment, depth = 0 }: { comment: any, depth?: number }) => (
    <div className={`relative group ${depth > 0 ? 'ml-8 mt-2 border-l-2 border-gray-100 pl-4' : 'border-b border-gray-100 pb-4 mb-4'}`}>
      <div className="flex items-center gap-2 mb-1">
        <span className="font-bold text-sm text-gray-800">{comment.user?.name || comment.user?.email || 'Người dùng'}</span>
        <span className="text-xs text-gray-500">{new Date(comment.createdAt).toLocaleDateString('vi-VN')}</span>
      </div>
      <p className="text-gray-700 text-sm">{comment.content}</p>
      
      <div className="flex items-center gap-4 mt-2">
        {!isOwner && (
          <button 
            onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)} 
            className="text-xs text-primary hover:underline font-medium"
          >
            Phản hồi
          </button>
        )}
        {(user?.id === comment.userId || isOwner || isAdmin) && (
           <button onClick={() => deleteComment(comment.id)} className="text-gray-400 hover:text-red-500 transition-colors p-1">
              <Trash2 className="w-3 h-3" />
           </button>
        )}
      </div>

      {replyingTo === comment.id && (
        <div className="mt-3 flex gap-2">
          <input 
            type="text" 
            placeholder="Nhập phản hồi..." 
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            className="flex-1 min-w-0 border border-borderLight rounded-xl px-3 py-1.5 text-sm outline-none focus:border-primary"
            onKeyDown={(e) => e.key === 'Enter' && submitComment(comment.id)}
            autoFocus
          />
          <button onClick={() => submitComment(comment.id)} className="bg-primary text-white shrink-0 px-3 py-1.5 rounded-xl text-sm font-bold hover:bg-primary-dark transition-colors">
            Gửi
          </button>
        </div>
      )}

      {comment.children && comment.children.length > 0 && (
        <div className="mt-3">
          {comment.children.map((child: any) => (
            <CommentNode key={child.id} comment={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-2xl p-6 shadow-card">
      <h3 className="font-bold text-lg mb-4">Bình luận ({comments.length})</h3>
      <div className="flex gap-2 mb-6">
        <input 
          type="text" 
          placeholder="Nhập bình luận của bạn..." 
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="flex-1 min-w-0 border border-borderLight rounded-xl px-4 py-2 outline-none focus:border-primary"
          onKeyDown={(e) => e.key === 'Enter' && submitComment()}
        />
        <button onClick={() => submitComment()} className="bg-primary text-white shrink-0 px-4 py-2 rounded-xl font-bold hover:bg-primary-dark transition-colors">
          Gửi
        </button>
      </div>
      <div className="space-y-4">
        {commentTree.map((comment: any) => (
          <CommentNode key={comment.id} comment={comment} />
        ))}
        {comments.length === 0 && <p className="text-gray-500 text-sm italic">Chưa có bình luận nào.</p>}
      </div>

      {/* Toast Notification for comments */}
      {toastMessage && (
        <div className="fixed bottom-24 md:bottom-10 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg z-[10001] text-sm animate-fade-in font-medium">
          {toastMessage}
        </div>
      )}
    </div>
  );
}
