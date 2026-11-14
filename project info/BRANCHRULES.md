# Branch Rules
### Never push to main, all work goes on your own branch
## 1. Start every task from the latest main:
   ```
   git checkout main
   git pull
   git checkout -b yourname-feature
   ```
## 2. Save your work
   ```
   git add .
   git commit -m "Description"
   git push -u origin yourname-feature
   ```
## 3. Open a pull request on GitHub into main. 
## 4. Before merging, make sure both servers still start
## 5. Merge your own pull request. If others depend on it or you changed server.js or db.js, send a message in the group chat so they can pull the latest from main
## 6. When your pull request is merged, go back to step 1 for your next task
