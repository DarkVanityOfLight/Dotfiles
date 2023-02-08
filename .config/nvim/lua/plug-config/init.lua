local Plug = vim.fn['plug#']

vim.call('plug#begin', '~/.config/nvim/plugged')
Plug 'itchyny/lightline.vim'
vim.call('plug#end')
