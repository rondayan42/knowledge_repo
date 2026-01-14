/* ==========================================
   ArticleEditor Page Tests
   ========================================== */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ArticleEditor from './ArticleEditor';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// Mock TipTap editor
vi.mock('@tiptap/react', () => ({
    useEditor: vi.fn(() => ({
        commands: {
            setContent: vi.fn(),
            focus: vi.fn(),
            toggleBold: vi.fn(),
            toggleItalic: vi.fn(),
            toggleStrike: vi.fn(),
            toggleUnderline: vi.fn(),
            toggleCode: vi.fn(),
            toggleBulletList: vi.fn(),
            toggleOrderedList: vi.fn(),
            toggleBlockquote: vi.fn(),
            setTextAlign: vi.fn(),
            toggleHeading: vi.fn(),
            setLink: vi.fn(),
            setImage: vi.fn(),
            insertTable: vi.fn(),
            undo: vi.fn(),
            redo: vi.fn(),
        },
        getHTML: vi.fn(() => '<p>Editor content</p>'),
        isActive: vi.fn(() => false),
        can: vi.fn(() => ({ undo: vi.fn(() => false), redo: vi.fn(() => false) })),
    })),
    EditorContent: ({ editor }) => <div data-testid="editor">Editor Content</div>,
}));

// Mock API
vi.mock('../../services/api', () => ({
    articlesAPI: {
        getOne: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    categoriesAPI: {
        getAll: vi.fn(),
    },
    departmentsAPI: {
        getAll: vi.fn(),
    },
    prioritiesAPI: {
        getAll: vi.fn(),
    },
    uploadAPI: {
        uploadAttachment: vi.fn(),
        uploadImage: vi.fn(),
    },
}));

// Mock toast
vi.mock('../../components/common/Toast', () => ({
    useToast: vi.fn(() => ({
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
    })),
}));

// Mock fileImporter
vi.mock('../../utils/fileImporter', () => ({
    importFile: vi.fn(),
}));

import { articlesAPI, categoriesAPI, departmentsAPI, prioritiesAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';

const renderEditor = (editId = null) => {
    const path = editId ? `/editor/${editId}` : '/editor';
    return render(
        <MemoryRouter initialEntries={[path]}>
            <Routes>
                <Route path="/editor" element={<ArticleEditor />} />
                <Route path="/editor/:id" element={<ArticleEditor />} />
            </Routes>
        </MemoryRouter>
    );
};

const mockCategories = [{ id: 1, name: 'Category 1' }];
const mockDepartments = [{ id: 1, name: 'Department 1' }];
const mockPriorities = [{ id: 1, name: 'High' }];
const mockArticle = {
    id: 1,
    title: 'Existing Article',
    summary: 'Existing summary',
    content: '<p>Existing content</p>',
    category_id: 1,
    department_id: 1,
    priority_id: 1,
    tags: [{ name: 'tag1' }],
};

describe('ArticleEditor Page', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        categoriesAPI.getAll.mockResolvedValue(mockCategories);
        departmentsAPI.getAll.mockResolvedValue(mockDepartments);
        prioritiesAPI.getAll.mockResolvedValue(mockPriorities);
        articlesAPI.getOne.mockResolvedValue(mockArticle);
        articlesAPI.create.mockResolvedValue({ id: 1 });
        articlesAPI.update.mockResolvedValue({});
    });

    describe('Create Mode', () => {
        it('displays create mode header', async () => {
            renderEditor();

            await waitFor(() => {
                expect(screen.getByText('יצירת מאמר חדש')).toBeInTheDocument();
            });
        });

        it('shows empty form fields', async () => {
            renderEditor();

            await waitFor(() => {
                const titleInput = screen.getByPlaceholderText('כותרת המאמר');
                expect(titleInput.value).toBe('');
            });
        });

        it('shows save button with create text', async () => {
            renderEditor();

            await waitFor(() => {
                expect(screen.getByText('שמור מאמר')).toBeInTheDocument();
            });
        });
    });

    describe('Edit Mode', () => {
        it('displays edit mode header', async () => {
            renderEditor('1');

            await waitFor(() => {
                expect(screen.getByText('עריכת מאמר')).toBeInTheDocument();
            });
        });

        it('loads article data', async () => {
            renderEditor('1');

            await waitFor(() => {
                expect(articlesAPI.getOne).toHaveBeenCalledWith('1');
            });
        });

        it('fills form with article data', async () => {
            renderEditor('1');

            await waitFor(() => {
                const titleInput = screen.getByPlaceholderText('כותרת המאמר');
                expect(titleInput.value).toBe('Existing Article');
            });
        });

        it('shows delete button in edit mode', async () => {
            renderEditor('1');

            await waitFor(() => {
                expect(screen.getByText('מחק מאמר')).toBeInTheDocument();
            });
        });
    });

    describe('Form Fields', () => {
        it('renders title input', async () => {
            renderEditor();

            await waitFor(() => {
                expect(screen.getByPlaceholderText('כותרת המאמר')).toBeInTheDocument();
            });
        });

        it('renders summary input', async () => {
            renderEditor();

            await waitFor(() => {
                expect(screen.getByPlaceholderText('תקציר קצר של המאמר')).toBeInTheDocument();
            });
        });

        it('renders category dropdown', async () => {
            renderEditor();

            await waitFor(() => {
                const categorySelect = document.querySelector('select');
                expect(categorySelect).toBeInTheDocument();
            });
        });

        it('renders editor', async () => {
            renderEditor();

            await waitFor(() => {
                expect(screen.getByTestId('editor')).toBeInTheDocument();
            });
        });
    });

    describe('Tags', () => {
        it('shows tag input', async () => {
            renderEditor();

            await waitFor(() => {
                expect(screen.getByPlaceholderText('הוסף תג...')).toBeInTheDocument();
            });
        });

        it('adds tag when button clicked', async () => {
            const user = userEvent.setup();
            renderEditor();

            await waitFor(() => {
                expect(screen.getByPlaceholderText('הוסף תג...')).toBeInTheDocument();
            });

            const tagInput = screen.getByPlaceholderText('הוסף תג...');
            await user.type(tagInput, 'newtag');
            await user.click(screen.getByText('+ הוסף'));

            expect(screen.getByText('newtag')).toBeInTheDocument();
        });
    });

    describe('Form Submission', () => {
        it('creates new article on submit', async () => {
            const user = userEvent.setup();
            const successToast = vi.fn();

            useToast.mockReturnValue({
                success: successToast,
                error: vi.fn(),
                info: vi.fn(),
            });

            renderEditor();

            await waitFor(() => {
                expect(screen.getByPlaceholderText('כותרת המאמר')).toBeInTheDocument();
            });

            await user.type(screen.getByPlaceholderText('כותרת המאמר'), 'New Article');
            await user.type(screen.getByPlaceholderText('תקציר קצר של המאמר'), 'Summary');

            await user.click(screen.getByText('שמור מאמר'));

            await waitFor(() => {
                expect(articlesAPI.create).toHaveBeenCalled();
            });
        });

        it('shows validation error when title is empty', async () => {
            const user = userEvent.setup();
            const errorToast = vi.fn();

            useToast.mockReturnValue({
                success: vi.fn(),
                error: errorToast,
                info: vi.fn(),
            });

            renderEditor();

            await waitFor(() => {
                expect(screen.getByText('שמור מאמר')).toBeInTheDocument();
            });

            await user.click(screen.getByText('שמור מאמר'));

            await waitFor(() => {
                expect(errorToast).toHaveBeenCalledWith('נא למלא כותרת');
            });
        });
    });

    describe('Delete Article', () => {
        it('deletes article when confirmed', async () => {
            const user = userEvent.setup();
            const successToast = vi.fn();
            window.confirm = vi.fn(() => true);
            articlesAPI.delete.mockResolvedValue({});

            useToast.mockReturnValue({
                success: successToast,
                error: vi.fn(),
                info: vi.fn(),
            });

            renderEditor('1');

            await waitFor(() => {
                expect(screen.getByText('מחק מאמר')).toBeInTheDocument();
            });

            await user.click(screen.getByText('מחק מאמר'));

            await waitFor(() => {
                expect(articlesAPI.delete).toHaveBeenCalledWith('1');
            });
        });
    });

    describe('Toolbar', () => {
        it('renders formatting toolbar', async () => {
            renderEditor();

            await waitFor(() => {
                expect(document.querySelector('.editor-toolbar')).toBeInTheDocument();
            });
        });
    });
});
