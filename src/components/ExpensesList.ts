import { Expense, ExpenseSummary } from '../types';
import { authManager } from '../auth';
import { supabase } from '../lib/supabase';

export function createExpensesList(
  itineraryId: string,
  isOwner: boolean,
  onAddExpense: () => void,
  onEditExpense: (expense: Expense) => void,
  onDeleteExpense: (expenseId: string) => void
): HTMLElement {
  const container = document.createElement('div');
  container.className = 'expenses-list-container';
  
  let expenses: Expense[] = [];
  let expenseSummary: ExpenseSummary[] = [];
  let isLoading = false;
  
  // Add styles
  const style = document.createElement('style');
  style.textContent = `
    .expenses-list-container {
      margin-bottom: 2rem;
    }

    .expenses-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .expenses-header h3 {
      color: #1e293b;
      font-size: 1.25rem;
      font-weight: 600;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .expenses-count {
      color: #64748b;
      font-size: 0.875rem;
    }

    .add-expense-btn {
      background: #667eea;
      color: white;
      border: none;
      padding: 0.5rem 1rem;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      transition: all 0.2s;
    }

    .add-expense-btn:hover {
      background: #5a67d8;
      transform: translateY(-1px);
    }

    .expenses-summary {
      background: #f8fafc;
      border-radius: 0.75rem;
      padding: 1.5rem;
      margin-bottom: 1.5rem;
    }

    .summary-title {
      color: #334155;
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 1rem 0;
    }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 1rem;
    }

    .summary-card {
      background: white;
      border-radius: 0.5rem;
      padding: 1rem;
      border: 1px solid #e2e8f0;
    }

    .summary-category {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    .category-icon {
      font-size: 1.25rem;
    }

    .category-name {
      color: #334155;
      font-weight: 600;
      font-size: 0.875rem;
    }

    .summary-amount {
      color: #1e293b;
      font-size: 1.25rem;
      font-weight: 700;
    }

    .summary-percentage {
      color: #64748b;
      font-size: 0.75rem;
      margin-top: 0.25rem;
    }

    .total-expenses {
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: #e0f2fe;
      border-radius: 0.5rem;
      padding: 1rem;
      margin-top: 1rem;
    }

    .total-label {
      color: #0369a1;
      font-weight: 600;
      font-size: 1rem;
    }

    .total-amount {
      color: #0c4a6e;
      font-size: 1.25rem;
      font-weight: 700;
    }

    .expenses-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 1rem;
    }

    .expenses-table th {
      text-align: left;
      padding: 0.75rem 1rem;
      background: #f1f5f9;
      color: #334155;
      font-weight: 600;
      font-size: 0.875rem;
      border-bottom: 1px solid #e2e8f0;
    }

    .expenses-table td {
      padding: 0.75rem 1rem;
      border-bottom: 1px solid #e2e8f0;
      color: #1e293b;
      font-size: 0.875rem;
    }

    .expenses-table tr:hover {
      background: #f8fafc;
    }

    .expense-amount {
      font-weight: 600;
      text-align: right;
    }

    .expense-date {
      color: #64748b;
      white-space: nowrap;
    }

    .expense-category {
      display: inline-block;
      padding: 0.25rem 0.5rem;
      border-radius: 0.25rem;
      font-size: 0.75rem;
      font-weight: 500;
      text-transform: capitalize;
    }

    .category-accommodation {
      background: #fee2e2;
      color: #b91c1c;
    }

    .category-food {
      background: #dcfce7;
      color: #166534;
    }

    .category-transportation {
      background: #e0f2fe;
      color: #0369a1;
    }

    .category-activity {
      background: #fef3c7;
      color: #92400e;
    }

    .category-shopping {
      background: #f3e8ff;
      color: #7e22ce;
    }

    .category-other {
      background: #f1f5f9;
      color: #334155;
    }

    .expense-actions {
      display: flex;
      gap: 0.5rem;
      justify-content: flex-end;
    }

    .edit-expense-btn, .delete-expense-btn {
      background: none;
      border: none;
      width: 28px;
      height: 28px;
      border-radius: 0.25rem;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .edit-expense-btn {
      color: #0369a1;
    }

    .edit-expense-btn:hover {
      background: #e0f2fe;
    }

    .delete-expense-btn {
      color: #b91c1c;
    }

    .delete-expense-btn:hover {
      background: #fee2e2;
    }

    .expenses-empty {
      text-align: center;
      padding: 2rem;
      background: #f8fafc;
      border-radius: 0.75rem;
      border: 2px dashed #e2e8f0;
    }

    .empty-expenses-icon {
      font-size: 3rem;
      margin-bottom: 1rem;
      color: #94a3b8;
    }

    .expenses-empty h4 {
      color: #334155;
      font-size: 1.125rem;
      font-weight: 600;
      margin: 0 0 0.5rem 0;
    }

    .expenses-empty p {
      color: #64748b;
      margin: 0 0 1.5rem 0;
      line-height: 1.5;
    }

    .expenses-loading {
      text-align: center;
      padding: 2rem;
      color: #64748b;
    }

    /* Responsive design */
    @media (max-width: 768px) {
      .summary-grid {
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      }

      .expenses-table {
        display: block;
        overflow-x: auto;
      }

      .expenses-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 1rem;
      }
    }
  `;
  
  if (!document.head.querySelector('#expenses-list-styles')) {
    style.id = 'expenses-list-styles';
    document.head.appendChild(style);
  }
  
  // Load expenses
  async function loadExpenses() {
    isLoading = true;
    renderExpensesList();
    
    try {
      // Load expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select(`
          *,
          user:profiles(*)
        `)
        .eq('itinerary_id', itineraryId)
        .order('expense_date', { ascending: false });
      
      if (expensesError) throw expensesError;
      
      expenses = expensesData || [];
      
      // Load expense summary
      const { data: summaryData, error: summaryError } = await supabase
        .rpc('get_expenses_summary', { itinerary_uuid: itineraryId });
      
      if (summaryError) throw summaryError;
      
      expenseSummary = summaryData || [];
      
    } catch (error) {
      console.error('Error loading expenses:', error);
    } finally {
      isLoading = false;
      renderExpensesList();
    }
  }
  
  // Render expenses list
  function renderExpensesList() {
    const totalExpenses = expenses.reduce((total, expense) => total + parseFloat(expense.amount.toString()), 0);
    const formattedTotal = formatCurrency(totalExpenses, expenses.length > 0 ? expenses[0].currency : 'USD');
    
    container.innerHTML = `
      <div class="expenses-header">
        <h3>
          <span class="header-icon">💰</span>
          Expenses
          <span class="expenses-count">(${expenses.length})</span>
        </h3>
        ${isOwner ? `
          <button class="add-expense-btn">
            <span class="btn-icon">+</span>
            <span class="btn-text">Add Expense</span>
          </button>
        ` : ''}
      </div>
      
      ${isLoading ? `
        <div class="expenses-loading">
          <div class="loading-spinner"></div>
          <p>Loading expenses...</p>
        </div>
      ` : expenses.length === 0 ? `
        <div class="expenses-empty">
          <div class="empty-expenses-icon">💰</div>
          <h4>No Expenses Yet</h4>
          <p>${isOwner ? 'Track your travel expenses by adding them to this itinerary.' : 'No expenses have been added to this itinerary yet.'}</p>
          ${isOwner ? `
            <button class="add-expense-btn">
              <span class="btn-icon">+</span>
              <span class="btn-text">Add First Expense</span>
            </button>
          ` : ''}
        </div>
      ` : `
        <div class="expenses-summary">
          <h4 class="summary-title">Expense Summary</h4>
          <div class="summary-grid">
            ${expenseSummary.map(summary => {
              const percentage = (summary.total_amount / totalExpenses * 100).toFixed(1);
              return `
                <div class="summary-card">
                  <div class="summary-category">
                    <span class="category-icon">${getCategoryIcon(summary.category)}</span>
                    <span class="category-name">${formatCategory(summary.category)}</span>
                  </div>
                  <div class="summary-amount">${formatCurrency(summary.total_amount, summary.currency)}</div>
                  <div class="summary-percentage">${percentage}% of total</div>
                </div>
              `;
            }).join('')}
          </div>
          <div class="total-expenses">
            <span class="total-label">Total Expenses</span>
            <span class="total-amount">${formattedTotal}</span>
          </div>
        </div>
        
        <table class="expenses-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Amount</th>
              ${isOwner ? '<th>Actions</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${expenses.map(expense => `
              <tr>
                <td class="expense-date">${formatDate(expense.expense_date)}</td>
                <td>${expense.description}</td>
                <td>
                  <span class="expense-category category-${expense.category}">
                    ${getCategoryIcon(expense.category)} ${formatCategory(expense.category)}
                  </span>
                </td>
                <td class="expense-amount">${formatCurrency(expense.amount, expense.currency)}</td>
                ${isOwner ? `
                  <td class="expense-actions">
                    <button class="edit-expense-btn" data-expense-id="${expense.id}" title="Edit">✏️</button>
                    <button class="delete-expense-btn" data-expense-id="${expense.id}" title="Delete">🗑️</button>
                  </td>
                ` : ''}
              </tr>
            `).join('')}
          </tbody>
        </table>
      `}
    `;
    
    // Add event listeners
    const addExpenseBtn = container.querySelector('.add-expense-btn') as HTMLButtonElement;
    addExpenseBtn?.addEventListener('click', onAddExpense);
    
    // Edit and delete buttons
    if (isOwner) {
      const editBtns = container.querySelectorAll('.edit-expense-btn');
      const deleteBtns = container.querySelectorAll('.delete-expense-btn');
      
      editBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const expenseId = (btn as HTMLButtonElement).dataset.expenseId;
          const expense = expenses.find(e => e.id === expenseId);
          if (expense) {
            onEditExpense(expense);
          }
        });
      });
      
      deleteBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const expenseId = (btn as HTMLButtonElement).dataset.expenseId;
          if (expenseId && confirm('Are you sure you want to delete this expense?')) {
            onDeleteExpense(expenseId);
          }
        });
      });
    }
  }
  
  // Helper functions
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
  
  function formatCurrency(amount: number, currency: string): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  }
  
  function formatCategory(category: string): string {
    return category.charAt(0).toUpperCase() + category.slice(1);
  }
  
  function getCategoryIcon(category: string): string {
    switch (category) {
      case 'accommodation':
        return '🏨';
      case 'food':
        return '🍽️';
      case 'transportation':
        return '🚗';
      case 'activity':
        return '🎯';
      case 'shopping':
        return '🛍️';
      case 'other':
        return '📌';
      default:
        return '💰';
    }
  }
  
  // Initial load
  loadExpenses();
  
  // Public methods
  container.refreshExpenses = loadExpenses;
  
  return container;
}