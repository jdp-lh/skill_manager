use std::fs;
use std::path::PathBuf;

fn main() {
    let p = PathBuf::from("test_dir");
    fs::create_dir(&p).unwrap();
    let symlink = PathBuf::from("test_symlink");
    std::os::unix::fs::symlink(&p, &symlink).unwrap();
    
    let meta = fs::symlink_metadata(&symlink).unwrap();
    println!("Is symlink: {}", meta.file_type().is_symlink());
    
    let res = fs::remove_file(&symlink);
    println!("remove_file on dir symlink: {:?}", res);
    
    fs::remove_dir(&p).unwrap();
}
